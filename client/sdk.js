/**
 * SDK for Flic buttons HTTP server
 */
const { Notifier, web3 } = require('../contract/.deployed');
const config = require('config');
const { getAddress } = require('../lib/eth-helpers');
const xipfs = require('../lib/xipfs');
const crypto = require('crypto');

const TRANSPORT = {
  SMS: 1,
  EMAIL: 2,
};

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
function notify(_account = null, _to = null, _message = null, _ether = null, _transport = null, _options = {}) {
  const account = _account || getAddress(config.get('client.ethereum.account'));
  const to = _to || config.get('client.sms.to');
  const message = _message || config.get('client.sms.message');
  const ether = _ether || config.get('client.sms.ether');
  const transport = _transport || TRANSPORT.SMS;
  const options = Object.assign({}, config.get('client.extended'), _options);

  const transactionObject = {
    from: account,
    value: web3.toWei(ether, 'ether'),
    gas: 1000000,
  };

  // Non-extended call
  if (!options.xipfs) {
    const params = [transport, to, message, transactionObject];
    return new Promise((resolve) => resolve(
      call(Notifier.notify, params)
    ));
  }

  console.log('Extended call via IPFS');

  const callParams = [
    transport,
    to,
    message,
  ];
  let ipfsData = callParams;

  if (options.encrypted) {
    console.log('encrypted!');
    const pubKey = `-----BEGIN PUBLIC KEY-----\n${Notifier.xIPFSPublicKey()}\n-----END PUBLIC KEY-----`;

    const encAlgo = 'aes-256-cbc';
    const symmetricKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const payloadCipher = crypto.createCipheriv(encAlgo, symmetricKey, iv);
    let payload = payloadCipher.update(JSON.stringify(callParams), 'utf8', 'base64');
    payload += payloadCipher.final('base64');

    ipfsData = {
      cipher: encAlgo,
      key: crypto.publicEncrypt({ key: pubKey }, symmetricKey).toString('base64'),
      iv: crypto.publicEncrypt({ key: pubKey }, iv).toString('base64'),
      data: payload,
    };
  }

  return xipfs.push(ipfsData).then(data => {
    console.log(`IPFS hash: ${data[0].hash}`);
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

/**
 * Generate cryptographically strong random UTF-8 string of length
 */
function randomString(length = 2048) {
  return crypto.randomBytes(length).toString('base64');
}

module.exports = { notify, balance, withdraw };
