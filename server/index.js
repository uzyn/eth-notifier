/**
 * Ethereum monitor
 *
 * Monitors Notifier contract activities on Ethereum
 * and performs actions accordingly
 */
const { Notifier } = require('../contract/.deployed');
const db = require('./component/db');
const sms = require('./component/sms');
const xipfs = require('../lib/xipfs');
const xdecrypt = require('./component/xipfs-decrypt');
const { setCheckStatusesTimer } = require('./component/status-checker');
const config = require('config');
const { getAddress } = require('../lib/eth-helpers');

console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);
console.log(`Admin (manager) account: ${getAddress(config.get('provider.ethereum.adminAccount'))}`);

function processPendingTask(taskId, attempt = 0) {
  const task = Notifier.tasks(taskId);
  let [xipfsHash, transport, destination, message, , txid] = task;

  if (xipfsHash) {
    console.log(`Getting IPFS hash ${xipfsHash}`);
    xipfs.get(xipfsHash).then(data => {
      let callParams = data;
      if (data.cipher) {
        callParams = xdecrypt(data);
      }

      [transport, destination, message] = callParams;
      if (parseInt(transport, 10) === 1) {
        sms.send(destination, message).then(twilioData =>
          db.msgSent(taskId, txid, twilioData.sid)
        ).then(() => {
          console.log(`Message sent to ${destination}.`);
          setCheckStatusesTimer(3000);
        });
      }
    }, () => {
      if (attempt <= 10) {
        console.log(`Attempt ${attempt}: Retry xipfs in 10 secs`);
        setTimeout(() => {
          processPendingTask(taskId, attempt + 1);
        }, 10000);
      }
    });
  } else {
    if (parseInt(transport, 10) === 1) {
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

setCheckStatusesTimer(3000);

