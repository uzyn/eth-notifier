/**
 * Sends notification via blockchain
 */
const { Notifier, web3 } = require('../build/.server/contracts.js');
const accounts = web3.eth.accounts;

Notifier.notify(
  '+6598318407',
  `Hello from blockchain. This message is initiated on ${new Date().toISOString()}.`,
  {
    from: accounts[2],
    value: web3.toWei(0.2, 'ether'),
  }
);
