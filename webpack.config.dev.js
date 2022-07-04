const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.config.common')
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  devServer: {
    static: path.join(__dirname, './dist')
  },
})