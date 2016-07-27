const path = require('path');
const nodeExternals = require('webpack-node-externals');
const config = require('./webpack.config.js');

config.entry = path.resolve(__dirname, 'server/loader/index.js');
config.output = {
  path: path.resolve(__dirname, 'build/js'),
  publicPath: '/js/',
  filename: 'server.js',
  libraryTarget: 'commonjs2',
};
config.target = 'node';
config.externals = [nodeExternals()];

module.exports = config;
