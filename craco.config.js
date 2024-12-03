const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          fs: false,
          path: require.resolve('path-browserify'),
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          buffer: require.resolve('buffer/'),
          assert: require.resolve('assert/'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          os: require.resolve('os-browserify/browser'),
          url: require.resolve('url/'),
          vm: require.resolve('vm-browserify'),
        },
      };
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(
                __dirname,
                'node_modules/sql.js/dist/sql-wasm.js'
              ),
              to: 'static/js',
            },
            {
              from: path.resolve(
                __dirname,
                'node_modules/sql.js/dist/sql-wasm.wasm'
              ),
              to: 'static/js',
            },
          ],
        }),
      ];
      return webpackConfig;
    },
  },
};
