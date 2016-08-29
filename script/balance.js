/**
 * Check balance
 */
const { Notifier, web3 } = require('../contract/.deployed.js');
const accounts = web3.eth.accounts;

console.log('[ Notifier smart contract ]');
console.log(`Contract balance on Ethereum chain:\t${inEth(web3.eth.getBalance(Notifier.address))}`);
console.log(`Spent balance (earned revenue):\t\t${inEth(Notifier.spentBalance())}`);
console.log();

console.log('[ Ethereum wallets ]');
for (const account of accounts) {
  let onholdStr = '';
  if (Notifier.onholdBalances(account).toNumber() > 0) {
    onholdStr = `(${inEth(Notifier.onholdBalances(account))} on hold)`;
  }

  console.log(`${account} - ${inEth(Notifier.availableBalances(account))} ${onholdStr}`);
}

function inEth(wei) {
  return `ETH ${web3.fromWei(wei, 'ether')}`;
}
