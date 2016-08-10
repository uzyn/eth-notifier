const { Notifier } = require('../build/.server/contracts.js');
const sms = require('./component/sms');
const db = require('./component/db');
// const accounts = web3.eth.accounts;

Notifier.TaskUpdated().watch((err, event) => {
  if (err || !event.args.taskId || !event.args.state) {
    console.log(err);
    return false;
  }

  const state = event.args.state.toNumber();

  if (state === 10) { // pending, send the message
    const task = Notifier.tasks(event.args.taskId);
    const [, , destination, message, txid] = task;


    sms.send(destination, message).then(twilioData =>
      db.msgSent(event.args.taskId, txid, twilioData.sid)
    ).then(() => {
      console.log(`Message sent to ${destination}.`);
    }, promiseErr => {
      // TODO: Return (unwithhold) user's funds
      console.log(promiseErr);
    });
  }

  return true;
});

function checkStatuses() {
  db.getAllWithoutPricing().then(data => {
    console.log('=> ', data);
  }, err => { console.log(err) });
}

checkStatuses();
setInterval(() => {
  checkStatuses();
}, 1000);

/*
function getTask(taskID) {
  return new Promise((resolve, reject) => {

  });
}
*/
console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);
