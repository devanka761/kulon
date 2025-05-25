const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

const appConfig = {
  entry: {
    koelonapp: "./src/client/js/app.js",
    koeloneditor: "./src/client/js/editor.js",
    koelonhome: "./src/client/js/home.js",
    koelonzonk: "./src/client/js/zonk.js"
  },
  entries: {
    koelonapp: {
      title: "koelonapp",
      filename: "app.html",
      template: "app.txt",
      chunks: ["koelonapp"]
    },
    koeloneditor: {
      title: "koeloneditor",
      filename: "editor.html",
      template: "editor.txt",
      chunks: ["koeloneditor"]
    },
    koelonhome: {
      title: "koelonhome",
      filename: "home.html",
      template: "home.txt",
      chunks: ["koelonhome"]
    },
    koelonzonk: {
      title: "koelonzonk",
      filename: "zonk.html",
      template: "zonk.txt",
      chunks: ["koelonzonk"]
    }
  },
};
const plugins = [
  new MiniCssExtractPlugin({
    filename: "[name].css",
  }),
];
Object.values(appConfig.entries).forEach((entryInfo, entryName) => {
  plugins.push(
    new HtmlWebpackPlugin({
      title: entryInfo.title,
      filename: path.join(__dirname, "./client/" + entryInfo.filename),
      template: "./templates/" + entryInfo.template,
      chunks: entryInfo.chunks,
      publicPath: "/bundle",
      chunksSortMode: "manual",
      inject: "body",
      scriptLoading: "module",
    })
  );
});

const entry = Object.keys(appConfig.entry).reduce(
  (entries, entry, entryName) => {
    entries[entry] = appConfig.entry[entry];
    return entries;
  },
  {}
);

module.exports = {
  mode: "development",
  watch: true,
  target: ["web", "es5"],
  externals: {
    "https://esm.sh/peerjs@1.5.4?bundle-deps": "Peer",
  },
  entry,
  output: {
    path: path.resolve(__dirname, "client/bundle"),
    filename: "[name].js",
    clean: true,
  },
  plugins,
  module: {
    rules: [
      {
        test: /\.(?:js|mjs|cjs)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            targets: "defaults",
            presets: [["@babel/preset-env"]],
          },
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
  devtool: false,
};
