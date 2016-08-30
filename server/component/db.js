/**
 * Simple SQLite database to keep track of
 * status and pricing of messages
 */
const config = require('config');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(config.get('provider.sqliteDatabase'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sms (
    taskid INTEGER PRIMARY KEY,
    timestamp INTEGER,
    txid INTEGER,
    twilioSid TEXT,
    twilioUSD NUMERIC,
    ethCharged NUMERIC,
    awaitingStatus BOOL
  )`);
  db.run('CREATE INDEX IF NOT EXISTS awaitingStatusIdx ON sms(awaitingStatus)');
  db.run('CREATE INDEX IF NOT EXISTS twilioSidIdx ON sms(twilioSid)');
  db.run('CREATE INDEX IF NOT EXISTS txidIdx ON sms(txid)');
});

/**
 * After a message is sent, but no pricing yet
 */
function msgSent(taskid, txid, twilioSid) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO sms VALUES (
      ${taskid},
      ${Date.now()},
      ${txid},
      '${twilioSid}',
      0,
      0,
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
function setFinalPrice(taskid, twilioUSD, ethCharged) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE sms SET
      twilioUSD = ${twilioUSD},
      ethCharged = ${ethCharged},
      awaitingStatus = 0
    WHERE taskid = ${taskid};`, (err, data) => {
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
