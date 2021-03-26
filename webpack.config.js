const path = require('path');

const webConfig = {
  mode: "production",
  target: "web",
  devtool: false,
  entry: {
    main: "./polympics/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: "polympics.js",
    library: "polympics"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    preferRelative: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: 'tsconfig.web.json'
        }
      }
    ]
  }
};

const nodeConfig = {
  mode: "production",
  target: "node",
  devtool: false,
  entry: {
    main: "./polympics/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: "polympics.js",
    library: {
      name: "polympics",
      type: "commonjs2"
    }
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    preferRelative: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: 'tsconfig.node.json'
        }
      }
    ]
  }
};

module.exports = [ webConfig, nodeConfig ];
