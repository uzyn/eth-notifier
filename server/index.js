/**
 * Ethereum monitor
 *
 * Monitors Notifier contract activities on Ethereum
 * and performs actions accordingly
 */
const { Notifier } = require('../contract/.deployed');
// const config = require('config');
const db = require('./component/db');
const sms = require('./component/sms');
const xipfs = require('../lib/xipfs');
const { setCheckStatusesTimer } = require('./component/status-checker');

console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);

function processPendingTask(taskId, attempt = 0) {
  const task = Notifier.tasks(taskId);
  let [xipfsHash, transport, destination, message, , txid] = task;

  if (xipfsHash) {
    console.log(`Getting IPFS hash ${xipfsHash}`);
    xipfs.get(xipfsHash).then(data => {
      [transport, destination, message] = data;
      if (parseInt(transport) === 1) {
        sms.send(destination, message).then(twilioData =>
          db.msgSent(taskId, txid, twilioData.sid)
        ).then(() => {
          console.log(`Message sent to ${destination}.`);
          setCheckStatusesTimer(3000);
        });
      }
    }, xipfsErr => {
      console.log(xipfsErr)
      if (attempt <= 5) {
        console.log('Retry xipfs in 30 secs');
        setTimeout(() => {
          processPendingTask(taskId, ++attempt);
        }, 30000);
      }
    });
  } else {
    if (parseInt(transport) === 1) {
      sms.send(destination, message).then(twilioData =>
        db.msgSent(taskId, txid, twilioData.sid)
      ).then(() => {
        console.log(`Message sent to ${destination}.`);
        setCheckStatusesTimer(3000);
      });
    }
  }
}

Notifier.TaskUpdated().watch((err, event) => {
  if (err || !event.args.taskId || !event.args.state) {
    console.log(err);
    return false;
  }

  const state = event.args.state.toNumber();

  if (state === 10) { // pending, send the message
    processPendingTask(event.args.taskId);
  } else if (state === 50) { // processed, costing done, tx settled
    console.log(`[Event] Task ID: ${event.args.taskId} is settled.`);
  }

  return true;
});

setCheckStatusesTimer(5000);

xipfs.get('QmUVFV5SEpbq7pee2pK15zQHi9yP56v5fydL4xqVAP1sSE').then(data => {
  console.log('RETURNED:', data);
}, err => console.log('EEEEEEE', err)
);
