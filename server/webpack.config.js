const path = require("path");

module.exports = {
  target: "node",
  mode: "development",
  entry: "./index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      bufferutil: false,
      "utf-8-validate": false,
    },
  },
  output: {
    filename: "server.js",
    path: path.resolve(__dirname, "dist"),
  },
};
