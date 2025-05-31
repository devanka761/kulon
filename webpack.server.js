const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  mode: "production",
  target: "node",
  entry: {
    server: "./src/server/server.js"
  },
  output: {
    path: path.resolve(__dirname, "dist/bundle"),
    filename: "[name].js",
    clean: true,
  },
  externals: [nodeExternals()],
  resolve: {
    extensions: [".js", ".ts"]
  },
  devtool: false,
}