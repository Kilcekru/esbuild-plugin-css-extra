# @kilcekru/esbuild-plugin-css-extra

Esbuild plugin to support Less, PostCSS & css modules.

## Installation

`npm install @kilcekru/esbuild-plugin-css-extra`

## Usage

```javascript
import esbuild from "esbuild";
import { CssExtraPlugin } from "@kilcekru/esbuild-plugin-css-extra";

esbuild.build({
  ...
  plugins: [
    CssExtraPlugin(),
  ],
  ...
});
*/
```

## License

Licensed under [MIT](https://github.com/Kilcekru/esbuild-plugin-css-extra/blob/main/LICENSE).