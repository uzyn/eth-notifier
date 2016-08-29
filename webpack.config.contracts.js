/*
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
*/

const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    index: path.resolve(__dirname, 'contract/'),
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, 'contract/.deployed/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  web3Loader: {
    constructorParams: {
    },
    deployedContracts: {
      Notifier: '0x4e2822607180a09a6eea85d3b98041a65135151b',
      owned: '0xeea97caba0ae3d0635ea4b37b58eb562e7775095',
      withAccounts: '0x96ca02cb4edc129fdc1d531bda6811c9642aafbd',
    },
  },
  externals: [nodeExternals()],
  module: {
    loaders: [
      {
        test: /\.sol$/,
        loaders: ['web3', 'solc'],
      },
      {
        test: /\.json$/,
        loaders: ['json'],
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ['babel'],
      },
    ],
  },
};