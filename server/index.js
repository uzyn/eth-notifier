const { Notifier, web3 } = require('../build/.server/contracts.js');

// console.log(Notifier);
//
const accounts = web3.eth.accounts;

Notifier.TaskUpdated().watch((err, event) => {
  console.log('EVEEEEEEEEE', event);
});

setInterval(() => {
  console.log('tasksCount', Notifier.tasksCount());
}, 1500);

// console.log(Notifier.notify);
// console.log(web3.eth.blockNumber);

setTimeout(() => {
  console.log('HEY!!!!!!!!', web3.eth.blockNumber);
  console.log(Notifier.notifyPls.estimateGas('a', 'baaaaaaaa'));


  console.log(Notifier.notifyPls('a', 'baaaaaaaa', { from: accounts[1] }));
//  console.log(Notifier.notifyPls('a', 'baaaaaaaa'));
}, 3000);


// console.log(Notifier.addOwner(accounts[1]));
// console.log(Notifier.a());
// console.log(Notifier.owner());
// console.log(Notifier.a);
/*
console.log(contracts.Notifier);
console.log(contracts.Notifier.a());
*/
