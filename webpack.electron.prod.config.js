const baseConfig = require('./webpack.electron.config');

module.exports = {
  ...baseConfig,
  mode: 'production',
  output: {
    path: process.cwd(),
    filename: 'index.js'
  }
};