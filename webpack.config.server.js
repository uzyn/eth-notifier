const path = require('path');
const nodeExternals = require('webpack-node-externals');
const config = require('./webpack.config.js');

config.entry = {
  contracts: path.resolve(__dirname, 'server/loader/contracts.js'),
};
config.output = {
  path: path.resolve(__dirname, 'build/.server'),
  filename: '[name].js',
  libraryTarget: 'commonjs2',
};
config.target = 'node';
config.externals = [nodeExternals()];

module.exports = config;
