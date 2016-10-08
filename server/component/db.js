/**
 * Simple SQLite database to keep track of
 * status and pricing of messages
 */
const config = require('config');
const sqlite3 = require('sqlite3');
const { web3, Notifier } = require('../../contract/.deployed');

const db = new sqlite3.Database(config.get('provider.sqliteDatabase').replace('{CONTRACT_ADDRESS}', Notifier.address.slice(0, 10)));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sms (
    id INTEGER PRIMARY KEY,
    timestamp INTEGER,
    twilioSid TEXT,
    usdTwilio NUMERIC,
    ethTwilio NUMERIC,
    ethCharged NUMERIC,
    ethUsd NUMERIC,
    awaitingStatus BOOL
  )`);
  db.run('CREATE INDEX IF NOT EXISTS awaitingStatusIdx ON sms(awaitingStatus)');
  db.run('CREATE INDEX IF NOT EXISTS twilioSidIdx ON sms(twilioSid)');
});

/**
 * After a message is sent, but no pricing yet
 */
function msgSent(id, twilioSid) {
  const ethUsd = config.get('provider.ethUsd');
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sms VALUES (
      ${id},
      ${Date.now()},
      '${twilioSid}',
      0,
      0,
      0,
      ${ethUsd},
      1
    );`, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

/**
 * Obtained prices, update table
 * Note: this does not deal with ETH refund
 */
function setFinalPrice(id, usdTwilio, ethCharged) {
  const ethUsd = config.get('provider.ethUsd');
  const ethTwilio = Math.ceil(usdTwilio / ethUsd * 1000000) / 1000000;

  return new Promise((resolve, reject) => {
    db.run(`UPDATE sms SET
      usdTwilio = ${usdTwilio},
      ethTwilio = ${ethTwilio},
      ethCharged = ${ethCharged},
      awaitingStatus = 0
    WHERE id = ${id};`, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

/**
 * Obtain a list of messages that have not yet have pricing details
 * in order to query Twilio about it
 */
function getAllWithoutPricing() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM sms WHERE awaitingStatus = 1', (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

module.exports = {
  msgSent,
  setFinalPrice,
  getAllWithoutPricing,
};
