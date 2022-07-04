const { merge } = require('webpack-merge')
const commonConfig = require('./webpack.config.common')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(commonConfig, {
  mode: 'production',
  output: {
    publicPath: "/public/"
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },
})