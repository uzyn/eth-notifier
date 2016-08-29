const path = require('path');
const nodeExternals = require('webpack-node-externals');
const config = require('./webpack.config.js');

config.entry = {
  index: path.resolve(__dirname, 'contract/'),
};
config.output = {
  path: path.resolve(__dirname, 'contract/.deployed/'),
  filename: '[name].js',
  libraryTarget: 'commonjs2',
};
config.target = 'node';
config.externals = [nodeExternals()];

module.exports = config;
