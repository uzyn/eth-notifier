/**
 * Check balance
 */
const { Notifier, web3 } = require('../build/.server/contracts.js');
const accounts = web3.eth.accounts;

for (const account of accounts) {
  let onholdStr = '';
  if (Notifier.onholdBalances(account).toNumber() > 0) {
    onholdStr = `(ETH ${web3.fromWei(Notifier.availableBalances(account), 'ether')} on hold)`;
  }

  console.log(`${account} - ETH ${web3.fromWei(Notifier.availableBalances(account), 'ether')} ${onholdStr}`);
}
