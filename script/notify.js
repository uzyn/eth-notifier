/**
 * Sends notification via blockchain
 */
const { Notifier, web3 } = require('../contract/.deployed.js');
const accounts = web3.eth.accounts;
const config = require('config');

const params = [
  '+6598318407',
  `Hello from blockchain. This message is initiated on ${new Date().toISOString()}.`,
  {
    from: accounts[1],
    value: web3.toWei(0.08, 'ether'),
    gas: 1000000,
  },
];

console.log(`Gas price: ${web3.fromWei(web3.eth.gasPrice, 'szabo')} szabo.`);
const estimatedGas = Notifier.notify.estimateGas(params[0], params[1], params[2]);
const gasInEth = parseFloat(web3.fromWei(estimatedGas * web3.eth.gasPrice, 'ether')).toFixed(4);
const gasInUsd = parseFloat(gasInEth * config.get('server.ethUsd')).toFixed(4);
console.log(`Gas estimated: ${estimatedGas} (ETH ${gasInEth} | USD ${gasInUsd})`);

Notifier.notify(params[0], params[1], params[2], (err, res) => {
  console.log(err);
  console.log(res);
});
