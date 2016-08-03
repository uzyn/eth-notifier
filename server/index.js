const { Notifier } = require('../build/.server/contracts.js');
const sms = require('./sms');
// const accounts = web3.eth.accounts;

Notifier.TaskUpdated().watch((err, event) => {
  if (err || !event.args.taskId || !event.args.state) {
    console.log(err);
    return false;
  }

  const state = event.args.state.toNumber();

  if (state === 10) { // pending, send the message
    const task = Notifier.tasks(event.args.taskId);
    const [, , destination, message] = task;
    sms.send(destination, message).then(data => {
      console.log(data);
    }, sendErr => console.log(sendErr));
  }

  return true;
});

/*
function getTask(taskID) {
  return new Promise((resolve, reject) => {

  });
}
*/
console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);
