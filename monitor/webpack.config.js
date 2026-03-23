const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"], // 自动解析扩展名
  },
  devServer: {
    static: "./dist",
    hot: true, // 热更新
  },
  devtool: "inline-source-map", // 方便调试
  plugins: [
    new HtmlWebpackPlugin({
      title: "Webpack TS Project",
      template: "./src/index.html", // 使用自定义模板
    }),
  ],
};
