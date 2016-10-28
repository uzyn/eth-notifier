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

function processPendingTask(id, attempt = 0) {
  const task = Notifier.tasks(id);
  const [sender, state, isxIPFS] = task;

  //let [xipfsHash, transport, destination, message, , txid] = task;

  if (isxIPFS) {
    const xipfsHash = Notifier.xnotifications(id);
    console.log(`Getting IPFS hash ${xipfsHash}`);
    xipfs.get(xipfsHash).then(data => {
      let callParams = data;
      if (data.cipher) {
        callParams = xdecrypt(data);
      }

      const [transport, destination, message] = callParams;
      if (parseInt(transport, 10) === 1) {
        sms.send(destination, message).then(twilioData =>
          db.msgSent(id, twilioData.sid)
        ).then(() => {
          console.log(`Message sent to ${destination}.`);
          setCheckStatusesTimer(3000);
        });
      }
    }, () => {
      if (attempt <= 10) {
        console.log(`Attempt ${attempt}: Retry xipfs in 10 secs`);
        setTimeout(() => {
          processPendingTask(id, attempt + 1);
        }, 10000);
      }
    });
  } else {
    const [transport, destination, message] = Notifier.notifications(id);
    if (parseInt(transport, 10) === 1) {
      sms.send(destination, message).then(twilioData =>
        db.msgSent(id, twilioData.sid)
      ).then(() => {
        console.log(`Message sent to ${destination}.`);
        setCheckStatusesTimer(3000);
      });
    }
  }
}

function processRefund(id) {
  const task = Notifier.tasks(id);
  const [sender] = task;

  if (Notifier.doNotAutoRefund(sender) === true) {
    console.log(`Do not auto refund is on for ${sender}`);
    return;
  }

  return Notifier.returnFund(sender, 0, {
    from: getAddress(config.get('provider.ethereum.adminAccount')),
    gas: 50000,
  }, err => {
    if (err) {
      console.log(err);
    }
    console.log('returnFund');
  });
}

Notifier.TaskUpdated().watch((err, event) => {
  if (err || !event.args.id || !event.args.state) {
    console.log(err);
    return false;
  }

  console.log('[Event]');
  console.log(event);

  const state = event.args.state.toNumber();
  const id = event.args.id.toNumber();

  if (state === 10) { // pending, send the message
    processPendingTask(id);
  } else if (state === 50) { // settled
    console.log(`[Event] Task ID: ${event.args.id} is settled.`);
    processRefund(id);
  }

  return true;
});

setCheckStatusesTimer(3000);
