import path from "path"
import webpack from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import publiEntries from "./publicEntries"

interface IAppConfigEntries {
  title: string
  filename: string
  template: string
  chunks: string[]
}

type IPlugins = (CleanWebpackPlugin | MiniCssExtractPlugin | HtmlWebpackPlugin)[]

const entryGroup: IAppConfigEntries[] = Object.keys(publiEntries).map((key) => ({
  title: key,
  filename: `${key}.ejs`,
  template: `${key}.ejs`,
  chunks: [key]
}))

const plugins: IPlugins = [
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: "[name]-[contenthash].css"
  })
]

Object.values(entryGroup).forEach((entryInfo, _entryName) => {
  plugins.push(
    new HtmlWebpackPlugin({
      title: entryInfo.title,
      filename: path.join(__dirname, "./views/" + entryInfo.filename),
      template: "!!raw-loader!./src/frontend/templates/" + entryInfo.template,
      chunks: entryInfo.chunks,
      publicPath: "/bundle",
      chunksSortMode: "manual",
      inject: "head",
      scriptLoading: "defer"
    })
  )
})

const entry = {
  sw: { import: "./src/frontend/scripts/sw.ts", filename: "../sw.js" },
  ...publiEntries
}

const config: webpack.Configuration = {
  mode: "production",
  entry,
  output: {
    path: path.resolve(__dirname, "public/bundle"),
    filename: "[name]-[contenthash].js",
    iife: false,
    clean: true
  },
  plugins,
  resolve: {
    extensions: [".ts", ".js", ".scss"]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: "supports es6-module"
                }
              ]
            ]
          }
        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    firefox: "69",
                    chrome: "64",
                    safari: "13",
                    edge: "79"
                  }
                }
              ],
              "@babel/preset-typescript"
            ]
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      }
    ]
  }
}

export default config
