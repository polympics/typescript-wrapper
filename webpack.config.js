const path = require('path');
const webpack = require('webpack');

const webConfig = {
  mode: 'production',
  target: 'web',
  devtool: false,
  entry: {
    main: './polympics/index.ts',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'polympics.js',
    library: 'polympics'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.web.json'
        }
      }
    ]
  }
};

const nodeConfig = {
  mode: 'development',
  target: 'node',
  devtool: false,
  entry: {
    main: './polympics/index.ts',
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'index.js',
    globalObject: 'this',
    library: {
      type: 'commonjs2'
    }
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.node.json'
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      fetch: ['../node_polyfills', 'fetch'],
      btoa: ['../node_polyfills', 'btoa']
    })
  ],
  externals: {
    'node-fetch': 'node-fetch',
    'btoa': 'btoa'
  }
};

module.exports = [ webConfig, nodeConfig ];
