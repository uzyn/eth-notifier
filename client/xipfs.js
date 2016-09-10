/**
 * Extended function calls to smart contract via
 * augmented IPFS calls
 * also supports encryption
 */
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001');
const stream = require('stream');

/*
const payload = new stream.Readable();
payload.push('hey world');
payload.push(null);
*/
// push({ a: 'hey dude' }).then(data => console.log('=============', data));

/*
ipfs.util.addFromStream(payload, (err, res) => {
  console.log(err);
  console.log(res);
});
*/
/**
 * Pushes payload to IPFS and returns hash asynchronously
 */
function push(_payload) {
  let payload = _payload;
  if (typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }
  console.log('payload=', payload);

  const plStream = new stream.Readable();
  plStream.push(payload);
  plStream.push(null);

  return new Promise((resolve, reject) => {
    ipfs.util.addFromStream(plStream, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

module.exports = { push };
