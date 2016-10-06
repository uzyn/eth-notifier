/**
 * Sends notification via IPFS
 */
const { Notifier, web3 } = require('../contract/.deployed');
const accounts = web3.eth.accounts;
const config = require('config');

const params = [
  'QmQwAP9vFjbCtKvD8RkJdCvPHqLQjZfW7Mqbbqx18zd8j7',
  {
    from: accounts[1],
    value: web3.toWei(0.08, 'ether'),
    gas: 1000000,
  },
];

console.log(`Gas price: ${web3.fromWei(web3.eth.gasPrice, 'szabo')} szabo.`);
const estimatedGas = Notifier.xnotify.estimateGas(params[0], params[1]);
const gasInEth = parseFloat(web3.fromWei(estimatedGas * web3.eth.gasPrice, 'ether')).toFixed(4);
const gasInUsd = parseFloat(gasInEth * config.get('provider.ethUsd')).toFixed(4);
console.log(`Gas estimated: ${estimatedGas} (ETH ${gasInEth} | USD ${gasInUsd})`);

// Estimate only
/*
Notifier.notify(params[0], params[1], params[2], params[3], (err, res) => {
  console.log(err);
  console.log(res);
});
*/
