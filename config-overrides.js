const {
  override,
  addWebpackAlias,
  addLessLoader,
  addWebpackModuleRule,
  adjustStyleLoaders,
  overrideDevServer,
} = require("customize-cra");

const path = require("path");

const webpackConfig = override(
  addWebpackAlias({ "@": path.resolve(__dirname, "src") }),
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true,
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

// 代理配置（需单独导出）
const devServerConfig = overrideDevServer((config) => ({
  ...config,
  proxy: {
    "/api": {
      target: "https://5093-2408-8940-41-ae85-20-9830-72d2-bec.ngrok-free.app/",
      changeOrigin: true,
      pathRewrite: { "^/api": "/api" }, // 按需启用路径重写
    },
  },
}));

module.exports = {
  webpack: webpackConfig, // Webpack配置
  devServer: devServerConfig, // DevServer配置
};
