const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    historyApiFallback: {
      disableDotRule: true
    },
    quiet: false,
    noInfo: false,
    lazy: false,
    watchOptions: {
      poll: false
    },
    https: false,
    contentBase: `${__dirname}/dist`,
    overlay: true,
    disableHostCheck: true
  },
});
