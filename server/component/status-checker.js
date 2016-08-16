/**
 * Handles checking of statuses from Twilio and
 * processes refund both on blockchain and on db
 */
const { Notifier, web3 } = require('../../build/.server/contracts');
const config = require('config');
const db = require('./db');
const sms = require('./sms');

let checkStatusesTimer = null;
let checkingStatuses = false;

// function declaration (get around JSLint's no use before declare
let setCheckStatusesTimer = null;

function processRefund(dbRow, usdPrice) {
  let ethPrice = usdPrice / config.get('server.ethUsd');
  ethPrice = Math.ceil(ethPrice * 10000) / 10000;
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

function checkStatuses() {
  checkingStatuses = true;
  console.log('[ENQ] Checking statuses of pending SMSes...');
  let dbRows;
  db.getAllWithoutPricing().then(rows => {
    dbRows = rows;
    console.log(`[ENQ] ${rows.length} pending messages...`);
    const twilioSids = rows.map(row => row.twilioSid);
    return sms.statuses(twilioSids);
  }).then(statuses => {
    checkingStatuses = false;
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

    let interval = 60000; // 1 minute
    if (dbRows.length === 0) {
      interval = 15 * 60000; // 15 minutes
    }
    setCheckStatusesTimer(interval);
  }, err => {
    console.log(err);
    checkingStatuses = false;
    setCheckStatusesTimer(60000);
  });
}

setCheckStatusesTimer = (interval) => {
  // Timer is running
  if (checkingStatuses) {
    return false;
  }

  if (checkStatusesTimer) {
    clearTimeout(checkStatusesTimer);
  }
  checkStatusesTimer = setTimeout(checkStatuses, interval);
  console.log(`[ENQ] Status timer is set to ${interval}ms.`);
  return true;
};

module.exports = { setCheckStatusesTimer };
