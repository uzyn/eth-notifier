/**
 * Sends notification via blockchain
 */
const { Notifier, web3 } = require('../build/.server/contracts.js');
const accounts = web3.eth.accounts;

Notifier.notify(
  '+6598318407',
  `Hello from blockchain - ${new Date().toISOString()}`,
  {
    from: accounts[2],
    value: web3.toWei(0.01, 'ether'),
  }
);
