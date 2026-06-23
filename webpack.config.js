import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import Dotenv from "dotenv-webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("--mode production");

export default {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProduction ? "bundle.[contenthash].js" : "bundle.js",
    clean: true,
  },
  devtool: isProduction ? "source-map" : "eval-source-map",
  devServer: {
    allowedHosts: [
      ".localhost",
      "localhost"
    ],
    port: process.env.PORT || 8080,
    hot: true,
    open: false,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.app.all('/api/proxy', async (req, res) => {
        const handler = (await import('./api/proxy.js')).default;

        // Add minimal express-like req.query and req.method structure that the vercel function expects
        const url = new URL(req.url, `http://${req.headers.host}`);
        req.query = Object.fromEntries(url.searchParams.entries());

        // Since proxy.js uses fetch, it needs absolute URLs or proper mocked res
        // We'll wrap the express res to be somewhat compatible with what Vercel provides

        await handler(req, res);
      });

      return middlewares;
    },

  },
  resolve: {
    extensions: [".js"]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        },
        resolve: {
          fullySpecified: false,
        }
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
          "postcss-loader"
        ]
      },
      {
        test: /\.svg$/,
        type: "asset/resource",
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: "./public/index.html",
      filename: "index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/robots.txt", to: "robots.txt" },
        { from: "public/sitemap.xml", to: "sitemap.xml" },
        { from: "public/favicon.svg", to: "favicon.svg" },
      ],
    }),
    new Dotenv(),
    ...(isProduction ? [new MiniCssExtractPlugin({
      filename: "styles.[contenthash].css",
    })] : [])
  ],
  optimization: {
    minimize: isProduction,
  },
  stats: "errors-warnings",
  performance: {
    hints: isProduction ? "warning" : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
}