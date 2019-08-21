var webpack = require('webpack');

module.exports = {
  entry: './docs/main.js',

  output: {
    filename: 'index.js',
    path: 'docs'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },

  devServer: {
    host: '0.0.0.0',
    port: 8080,
  }
};
