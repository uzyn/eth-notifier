/**
 * HTTP server for Flic buttons
 * implements a server and outputs plain text
 */
const client = require('./sdk');
const config = require('config');
const app = require('express')();

app.get('/', (req, res) =>
  res.send(`Available endpoints:
    /notify - Sends a notification
    /balance - Returns balance on Ethereum blockchain and on Notifier contract
    /withdraw - Withdraw balance on Notifier contract to account
  `)
);

/**
 * Notify with default configuration
 */
app.get('/notify', (req, res) =>
  client.notify().then(txid =>
    res.send(`[Default] Notification sent\ntx: ${txid}`)
  )
);

// Without xipfs
app.get('/notify/plain', (req, res) =>
  client.notify(null, null, null, null, null, { xipfs: false }).then(txid =>
    res.send(`[Plain] Notification sent\ntx: ${txid}`)
  )
);

/**
 * Notify via xipfs
 *
 * /xipfs for non-encrypted xipfs
 * /xipfs/encrypted for encrypted xipfs
 */
function xipfsNotify(req, res) {
  let boolEncrypted = false;
  if (req.params.encrypted) {
    boolEncrypted = true;
  }
  return client.notify(null, null, null, null, null, { ipfs: true, encrypted: boolEncrypted }).then(txid =>
    res.send(`[xIPFS - Encrypted: ${boolEncrypted.toString()}] Notification sent\ntx: ${txid}`)
  );
}
app.get('/notify/xipfs', xipfsNotify);
app.get('/notify/xipfs/:encrypted', xipfsNotify);

app.get('/balance', (req, res) => {
  const balance = client.balance();
  return res.send(`Balances:
    In wallet: ETH ${balance.wallet}
    On service (avail): ETH ${balance.service.available}
    On service (on hold): ETH ${balance.service.onhold}
  `);
});

app.get('/withdraw', (req, res) => {
  const txid = client.withdraw();
  return res.send(`Successful withdrawal\ntx: ${txid}`);
});

const server = app.listen(config.get('client.http.port'), () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log(`Flic's HTTP server for ETH Notifier is now listening at http://${host}:${port}`);
});
