/**
 * Check balance
 */
const { Notifier, web3 } = require('../build/.server/contracts.js');
const accounts = web3.eth.accounts;

//console.log(accounts);

for (const account of accounts) {
  let onholdStr = '';
  if (Notifier.onholdBalances(account).toNumber() > 0) {
    onholdStr = `(ETH ${web3.fromWei(Notifier.availableBalances(account), 'ether')} on hold)`;
  }

  console.log(`[${account}] - ETH ${web3.fromWei(Notifier.availableBalances(account), 'ether')} ${onholdStr}`);


  //console.log(Notifier.availableBalances(account));
}

/*

Notifier.notify(
  '+6598318407',
  `Hello from blockchain. This message is initiated on ${new Date().toISOString()}.`,
  {
    from: accounts[2],
    value: web3.toWei(0.1, 'ether'),
  }
);
*/
