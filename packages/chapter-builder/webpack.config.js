const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'h5p-standalone-wrapper': './src/h5p-wrapper.js',
    'pie-player-components': './src/pie-wrapper.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};
