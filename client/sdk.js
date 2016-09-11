/**
 * SDK for Flic buttons HTTP server
 */
const { Notifier, web3 } = require('../contract/.deployed');
const config = require('config');
const { getAddress } = require('../server/component/eth-helpers');
const xipfs = require('./xipfs');

/**
 * Call a smart contract method passing in parameters
 * Also output gas cost
 */
function call(method, params) {
  const estimatedGas = method.estimateGas(...params);
  const gasInEth = parseFloat(web3.fromWei(estimatedGas * web3.eth.gasPrice, 'ether')).toFixed(4);
  const gasInUsd = parseFloat(gasInEth * config.get('provider.ethUsd')).toFixed(4);
  console.log(`Gas estimated: ${estimatedGas} (ETH ${gasInEth} | USD ${gasInUsd})`);
  return method(...params);
}

/**
 * Sends an SMS notification
 * _options {
 *   xipfs: true, for augmented ipfs support
 *   encrypted: true, for encryption support
 * }
 */
function notify(_account = null, _to = null, _message = null, _ether = null, _options = {}) {
  const account = _account || getAddress(config.get('client.ethereum.account'));
  const to = _to || config.get('client.sms.to');
  const message = _message || config.get('client.sms.message');
  const ether = _ether || config.get('client.sms.ether');
  const options = Object.assign(config.get('client.extended'), _options);

  const transactionObject = {
    from: account,
    value: web3.toWei(ether, 'ether'),
    gas: 1000000,
  };

  // Non-extended call
  if (!options.xipfs) {
    const params = [to, message, transactionObject];
    return new Promise((resolve) => resolve(
      call(Notifier.notify, params)
    ));
  }

  console.log('Extended call via IPFS');
  const ipfsData = [
    to,
    message,
  ];

  return xipfs.push(ipfsData).then(data => {
    const params = [
      data[0].hash,
      transactionObject,
    ];
    return call(Notifier.xnotify, params);
  });
}

/**
 * Returns balance of account (address)
 */
function balance(_account = null) {
  const account = _account || getAddress(config.get('client.ethereum.account'));

  return {
    wallet: web3.fromWei(web3.eth.getBalance(account), 'ether'),
    service: {
      available: web3.fromWei(Notifier.availableBalances(account), 'ether'),
      onhold: web3.fromWei(Notifier.onholdBalances(account), 'ether'),
    },
  };
}

/**
 * Withdrawing of Ether from contract balance to actual Ethereum balance
 */
function withdraw(_account = null, _amount = 0) {
  const account = _account || getAddress(config.get('client.ethereum.account'));

  return Notifier.withdraw(_amount, { from: account });
}

module.exports = { notify, balance, withdraw };
