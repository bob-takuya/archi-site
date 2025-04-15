const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 環境に基づいてpublicPathを設定
const isProduction = process.env.NODE_ENV === 'production';
const publicPath = isProduction ? '/Archi-site/' : '/';

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: publicPath
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify")
    }
  },
  devServer: {
    historyApiFallback: true,
    port: 8080,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3000'
      }
    ],
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    devMiddleware: {
      publicPath: publicPath
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      publicPath: publicPath
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public/sql-wasm.wasm',
          to: './'
        },
        {
          from: 'public/sqlite.worker.js',
          to: './'
        },
        {
          from: 'Archimap_database.sqlite',
          to: 'db/archimap.sqlite'
        }
      ]
    })
  ]
}; 