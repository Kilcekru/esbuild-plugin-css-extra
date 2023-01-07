import * as FS from "node:fs";
import * as Path from "node:path";
import { promisify } from "node:util";

import type { Plugin } from "esbuild";
import less from "less";
import postcss, { Plugin as PostCssPlugin } from "postcss";
import postcssModules from "postcss-modules";

const readFile = promisify(FS.readFile);

export const CssExtraPlugin = (options?: Options): Plugin => ({
	name: "css-extra",
	setup: function (build) {
		const modulesMap = new Map<string, Record<string, string>>();
		const cssMap = new Map<string, string>();

		const defaultProcessor = postcss(options?.plugins ?? []);
		const modulesProcessor = postcss([
			postcssModules({
				getJSON: (filePath, classNames) => {
					modulesMap.set(filePath, classNames);
				},
			}),
			...(options?.plugins ?? []),
		]);

		build.onLoad({ filter: options?.filter ?? /.\.(css|less)$/, namespace: "file" }, async (args) => {
			const fileContent = await readFile(args.path, "utf-8");
			const fileExt = Path.extname(args.path);

			let css: string;
			let watchFiles: string[];
			switch (fileExt) {
				case ".less": {
					const rendered = await less.render(fileContent, { ...options?.lessOptions, filename: args.path });
					css = rendered.css;
					watchFiles = rendered.imports;
					break;
				}
				default: {
					css = fileContent;
					watchFiles = [];
					break;
				}
			}

			const fileBase = Path.basename(args.path, fileExt);
			const isModule =
				options?.isModule != undefined
					? typeof options.isModule === "function"
						? options.isModule(args.path)
						: options.isModule.test(args.path)
					: fileBase.endsWith(".module");

			if (!isModule) {
				return {
					contents: (await defaultProcessor.process(css, { from: args.path })).css,
					loader: "css",
					watchFiles,
				};
			}

			const result = await modulesProcessor.process(css, { from: args.path });
			cssMap.set(args.path, result.css);

			const classNames = modulesMap.get(args.path);

			return {
				contents: `import "css-extra";export default ${JSON.stringify(classNames)}`,
				loader: "js",
				watchFiles,
			};
		});

		build.onResolve({ filter: /^css-extra$/ }, (args) => {
			return { path: args.importer, namespace: "css-extra" };
		});

		build.onLoad({ filter: /./, namespace: "css-extra" }, (args) => {
			const css = cssMap.get(args.path);

			return {
				contents: css,
				loader: "css",
				resolveDir: Path.dirname(args.path),
			};
		});
	},
});

export interface Options {
	/** */
	filter?: RegExp;
	/** */
	plugins?: PostCssPlugin[];
	/** */
	isModule?: RegExp | ((fileName: string) => boolean);
	/** */
	lessOptions: Less.Options;
}
