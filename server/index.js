/**
 * Ethereum monitor
 *
 * Monitors Notifier contract activities on Ethereum
 * and performs actions accordingly
 */
const { Notifier, web3 } = require('../build/.server/contracts.js');
const config = require('config');
const db = require('./component/db');
const sms = require('./component/sms');
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

function processRefund(dbRow, usdPrice) {
  console.log(dbRow, usdPrice);
  console.log('wwwwwwwwwwwwwwwwwwwww');
  console.log(config.get('server.ethUsd'));
  const ethPrice = usdPrice / config.get('server.ethUsd');
  console.log('ddddddddddddddddddddddd');
    console.log(dbRow.txid, ethPrice);
  return new Promise((resolve, reject) => {
    console.log('ssssssssssssssssssssssssssss');
    console.log(dbRow.txid, ethPrice);
    Notifier.taskProcessedWithCosting(dbRow.txid, ethPrice, {
      from: web3.eth.accounts[config.get('ethereum.adminAccount')],
    }, err => {
      console.log(err);
      if (err) {
        return reject(err);
      }
      return db.setFinalPrice(dbRow.taskid, usdPrice, ethPrice);
    });
  });
}

const checkStatusesInterval = 10000; // 1 minute
function checkStatuses() {
  console.log('[ENQ] Checking statuses of pending SMSes...');
  let dbRows;
  db.getAllWithoutPricing().then(rows => {
    dbRows = rows;
    console.log(`[ENQ] ${rows.length} pending messages...`);
    const twilioSids = rows.map(row => row.twilioSid);
    return sms.statuses(twilioSids);
  }).then(statuses => {
    statuses.forEach(status => {
      if (status.price_unit !== 'USD') {
        console.log(`Unknown price unit returned from Twilio – ${status.price_unit}`);
      }
      const dbRow = dbRows.find(row => row.twilioSid === status.sid);
      processRefund(dbRow, Math.abs(parseFloat(status.price)));
    });
    setTimeout(checkStatuses, checkStatusesInterval);
  }, err => {
    console.log(err);
    setTimeout(checkStatuses, checkStatusesInterval);
  });
}

checkStatuses();
/*
setInterval(() => {
  checkStatuses();
}, 1000);
*/
/*
function getTask(taskID) {
  return new Promise((resolve, reject) => {

  });
}
*/
console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);
