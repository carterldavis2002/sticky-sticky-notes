const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/js/index.js', 
  output: {
    filename: '[name].[contenthash].js', 
    path: path.resolve('dist'), 
    assetModuleFilename: 'img/[hash][ext][query]',
    clean: true 
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "index.html"),
      favicon: path.resolve(__dirname, "src", "img", "favicon.ico")
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.png$/i,
        type: 'asset/resource'
      }
    ],
  },
};