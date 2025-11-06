import path from "path"
import webpack from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"

interface IAppConfigEntries {
  title: string
  filename: string
  template: string
  chunks: string[]
}

interface IAppConfig {
  entry: webpack.EntryObject
  entries: {
    [key: string]: IAppConfigEntries
  }
}

type IPlugins = (CleanWebpackPlugin | MiniCssExtractPlugin | HtmlWebpackPlugin)[]

const appConfig: IAppConfig = {
  entry: {
    app: "./src/frontend/scripts/app.ts",
    home: "./src/frontend/scripts/home.ts",
    editor: "./src/frontend/scripts/editor.ts",
    // privacy: "./src/frontend/scripts/legal.ts",
    // terms: "./src/frontend/scripts/legal.ts",
    // license: "./src/frontend/scripts/license.ts",
    // autherror: "./src/frontend/scripts/404.ts",
    404: "./src/frontend/scripts/404.ts"
  },
  entries: {
    app: {
      title: "app",
      filename: "app.ejs",
      template: "app.ejs",
      chunks: ["app"]
    },
    home: {
      title: "home",
      filename: "home.ejs",
      template: "home.ejs",
      chunks: ["home"]
    },
    editor: {
      title: "editor",
      filename: "editor.ejs",
      template: "editor.ejs",
      chunks: ["editor"]
    },
    // privacy: {
    //   title: "privacy",
    //   filename: "privacy.ejs",
    //   template: "privacy.ejs",
    //   chunks: ["privacy"]
    // },
    // terms: {
    //   title: "terms",
    //   filename: "terms.ejs",
    //   template: "terms.ejs",
    //   chunks: ["terms"]
    // },
    // license: {
    //   title: "license",
    //   filename: "license.ejs",
    //   template: "license.ejs",
    //   chunks: ["license"]
    // },
    // autherror: {
    //   title: "autherror",
    //   filename: "autherror.ejs",
    //   template: "autherror.ejs",
    //   chunks: ["autherror"]
    // },
    404: {
      title: "404",
      filename: "404.ejs",
      template: "404.ejs",
      chunks: ["404"]
    }
  }
}

const plugins: IPlugins = [
  new CleanWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: "[name].css"
  })
]

Object.values(appConfig.entries).forEach((entryInfo, _entryName) => {
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
  ...appConfig.entry
}

const config: webpack.Configuration = {
  mode: "development",
  entry,
  output: {
    path: path.resolve(__dirname, "public/bundle"),
    filename: "[name].js",
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
          loader: "babel-loader"
        }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-typescript"]
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      }
    ]
  },
  watch: true
}

export default config
