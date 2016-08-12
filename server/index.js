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
  } else if (state === 50) { // processed, costing done, tx settled
    console.log(`[Event] Task ID: ${event.args.taskId} is settled.`);
  }

  return true;
});

function processRefund(dbRow, usdPrice) {
  const ethPrice = usdPrice / config.get('server.ethUsd');
  const weiPrice = web3.toWei(ethPrice, 'ether');
  return new Promise((resolve, reject) => {
    Notifier.taskProcessedWithCosting(dbRow.txid, weiPrice, {
      from: web3.eth.accounts[config.get('ethereum.adminAccount')],
    }, err => {
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

      let priceUsd = Math.abs(parseFloat(status.price));
      if (isNaN(priceUsd)) {
        priceUsd = 0;
      }
      processRefund(dbRow, priceUsd);
    });
    setTimeout(checkStatuses, checkStatusesInterval);
  }, err => {
    console.log(err);
    setTimeout(checkStatuses, checkStatusesInterval);
  });
}

checkStatuses();

console.log('\n[ ETH Notifier ]');
console.log(`Watching smart contract at ${Notifier.address}`);
