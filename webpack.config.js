const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var TypedocWebpackPlugin = require('typedoc-webpack-plugin');
const fs = require('fs');

const environment = process.env.NODE_ENV || 'development';


let config = {
  entry: [ 'whatwg-fetch', './vendor/faye.js', './src/index.js' ],

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  },

  output: {
    filename: 'monsterconnect.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: [ '.ts', '.js']
  },
  plugins: [
    new TypedocWebpackPlugin({ module: 'commonjs' }, './src/index.js')
  ]
};

if (environment === 'production') {
  config.plugins = config.plugins.concat([
    new UglifyJSPlugin({
      sourceMap: false
    })
  ]);
}


module.exports = config;
