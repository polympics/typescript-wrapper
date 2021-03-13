const path = require('path');

module.exports = {
  mode: "production",
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
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};
