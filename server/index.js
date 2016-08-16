/**
 * Ethereum monitor
 *
 * Monitors Notifier contract activities on Ethereum
 * and performs actions accordingly
 */
const { Notifier } = require('../build/.server/contracts');
// const config = require('config');
const db = require('./component/db');
const sms = require('./component/sms');
const { setCheckStatusesTimer } = require('./component/status-checker');

console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);

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
      setCheckStatusesTimer(1000);
    }, promiseErr => {
      // TODO: Return (unwithhold) user's funds
      console.log(promiseErr);
    });
  } else if (state === 50) { // processed, costing done, tx settled
    console.log(`[Event] Task ID: ${event.args.taskId} is settled.`);
  }

  return true;
});

setCheckStatusesTimer(5000);

