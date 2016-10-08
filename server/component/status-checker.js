/**
 * Handles checking of statuses from Twilio and
 * processes refund both on blockchain and on db
 */
const { Notifier, web3 } = require('../../contract/.deployed');
const config = require('config');
const { getAddress } = require('../../lib/eth-helpers');
const db = require('./db');
const sms = require('./sms');

let checkStatusesTimer = null;
let checkingStatuses = false;

// function declaration (get around JSLint's no use before declare
let setCheckStatusesTimer = null;

function settleTask(dbRow, usdPrice) {
  const task = Notifier.tasks(dbRow.id);
  const [sender] = task;

  let ethPrice = usdPrice / config.get('provider.ethUsd') * (1 + config.get('provider.pctMargin')) + config.get('provider.flatMarginInEth');

  // Fee reduction if no auto refund
  if (Notifier.doNotAutoRefund(sender)) {
    ethPrice -= config.get('provider.noAutoRefundRefundInEth');
  }

  ethPrice = Math.ceil(ethPrice * 1000000) / 1000000;
  const weiPrice = web3.toWei(ethPrice, 'ether');

  console.log(dbRow.id, usdPrice, ethPrice, weiPrice);

  const promises = [
    new Promise((resolve, reject) => {
      Notifier.taskProcessedWithCosting(dbRow.id, weiPrice, {
        from: getAddress(config.get('provider.ethereum.adminAccount')),
        gas: 1000000,
      }, err => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        console.log('taskProcessedWithCosting');
        return resolve();
      });
    }),

    db.setFinalPrice(dbRow.id, usdPrice, ethPrice),
  ];

  return Promise.all(promises);
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
    const promises = [];
    statuses.forEach(status => {
      if (status && status.price_unit) {
        if (status.price_unit !== 'USD') {
          console.log(`Unknown price unit returned from Twilio – ${status.price_unit}`);
        }
        const dbRow = dbRows.find(row => row.twilioSid === status.sid);
        let priceUsd = Math.abs(parseFloat(status.price));
        if (isNaN(priceUsd)) {
          priceUsd = 0;
        }
        promises.push(settleTask(dbRow, priceUsd));
      }
    });

    Promise.all(promises).then(() => {
      let interval = 30000; // 0.5 minute
      if (dbRows.length === 0) {
        interval = 15 * 60000; // 15 minutes
      }
      setCheckStatusesTimer(interval);
    }, err => {
      console.err(err);
    });
  }, err => {
    console.log(err);
    checkingStatuses = false;
    setCheckStatusesTimer(30000);
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
