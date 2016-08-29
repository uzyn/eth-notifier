/**
 * SDK for Flic buttons HTTP server
 */
const { Notifier, web3 } = require('../contract/.deployed');
const config = require('config');
const { getAddress } = require('../server/component/eth-helpers');

/**
 * Sends an SMS notification
 */
function notify(_account = null, _to = null, _message = null, _ether = null) {
  const account = _account || getAddress(config.get('client.account'));
  const to = _to || config.get('client.sms.to');
  const message = _message || config.get('client.sms.message');
  const ether = _ether || config.get('client.sms.ether');

  const params = [
    to,
    message,
    {
      from: account,
      value: web3.toWei(ether, 'ether'),
      gas: 1000000,
    },
  ];

  console.log(`Gas price: ${web3.fromWei(web3.eth.gasPrice, 'szabo')} szabo.`);
  const estimatedGas = Notifier.notify.estimateGas(params[0], params[1], params[2]);
  const gasInEth = parseFloat(web3.fromWei(estimatedGas * web3.eth.gasPrice, 'ether')).toFixed(4);
  const gasInUsd = parseFloat(gasInEth * config.get('server.ethUsd')).toFixed(4);
  console.log(`Gas estimated: ${estimatedGas} (ETH ${gasInEth} | USD ${gasInUsd})`);

  return Notifier.notify(params[0], params[1], params[2]);
}

/**
 * Returns balance of account (address)
 */
function balance(_account = null) {
  const account = _account || getAddress(config.get('client.account'));

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
  const account = _account || getAddress(config.get('client.account'));

  return Notifier.withdraw(_amount, { from: account });
}

module.exports = { notify, balance, withdraw };
