const path = require("path");

const ROOT_DIR = __dirname;
const SRC_DIR = path.resolve(ROOT_DIR, "src");
const DIST_DIR = path.resolve(ROOT_DIR, "dist");

const createBaseConfig = (mode) => ({
  mode,
  entry: path.resolve(SRC_DIR, "index.ts"),
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
  devtool:
    mode === "production" ? "source-map" : "eval-cheap-module-source-map",
  stats: "errors-warnings",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: false,
  },
});

module.exports = (_env, argv = {}) => {
  const mode = argv.mode === "development" ? "development" : "production";
  const baseConfig = createBaseConfig(mode);

  return [
    {
      ...baseConfig,
      name: "cjs",
      output: {
        filename: "index.cjs",
        path: DIST_DIR,
        clean: true,
        library: {
          type: "commonjs2",
        },
      },
    },
    {
      ...baseConfig,
      name: "esm",
      experiments: {
        outputModule: true,
      },
      output: {
        filename: "index.mjs",
        path: DIST_DIR,
        clean: false,
        module: true,
        library: {
          type: "module",
        },
      },
    },
  ];
};
