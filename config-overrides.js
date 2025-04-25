const {
  override,
  addWebpackAlias,
  addLessLoader,
  addWebpackModuleRule,
  adjustStyleLoaders
} = require("customize-cra");
const path = require("path");

module.exports = override(
  addWebpackAlias({ "@": path.resolve(__dirname, "src") }),
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true
    },
  }),
  addWebpackModuleRule({
    test: /\.module\.less$/,
    use: [
      "style-loader",
      {
        loader: "css-loader",
        options: {
          modules: { localIdentName: "[local]__[hash:base64:5]" },
        },
      },
      "less-loader",
    ],
  }),
  adjustStyleLoaders(({ use: [, , postcss] }) => {
    if (postcss?.loader?.includes("postcss-loader")) {
      if (!postcss.options.postcssOptions) {
        postcss.options = {
          postcssOptions: postcss.options || {},
        };
      }
    }
  })
);
