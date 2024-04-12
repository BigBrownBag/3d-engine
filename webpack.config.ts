import path from 'path';
import HtmlWebpackPlugin from "html-webpack-plugin";
import TerserWebpackPlugin from "terser-webpack-plugin";
import ESLintWebpackPlugin from "eslint-webpack-plugin";

const isDev = process.env.NODE_ENV === "development";

const filename = (ext: string) =>
  isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

module.exports = {
    entry: path.resolve(__dirname, "src", "index.ts"),
    output: {
        filename: filename("js"),
        path: path.resolve(__dirname, "build"),
        clean: true
    },
    optimization: {
        splitChunks: {
            chunks: "all",
        },
        minimizer: [new TerserWebpackPlugin()],
    },
    devServer: isDev ? {
        port: 4200,
        hot: isDev,
    } : undefined,
    devtool: isDev ? "source-map" : false,
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "public", "index.html"),
            favicon: path.resolve(__dirname, "public",  "favicon.ico")
        }),
        new ESLintWebpackPlugin()
    ],
    resolve: {
      extensions: ['.ts', '.js', '.html'],
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-typescript"],
                    },
                },
            },
        ]
    }
};