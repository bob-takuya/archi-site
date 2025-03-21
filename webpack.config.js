const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 環境に基づいてpublicPathを設定
const isProduction = process.env.NODE_ENV === 'production';
const publicPath = isProduction ? '/Archi-site/' : '/';

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    // 環境変数に基づいて設定
    publicPath: publicPath
  },
  module: {
    rules: [
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
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
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
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
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