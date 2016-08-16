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

app.get('/notify', (req, res) => {
  const txid = client.notify();
  return res.send(`Notification sent\ntx: ${txid}`);
});

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
