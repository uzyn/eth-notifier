/**
 * Extended function calls to smart contract via
 * augmented IPFS calls
 * also supports encryption
 */
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001');
const stream = require('stream');

/**
 * Pushes payload to IPFS and returns hash asynchronously
 */
function push(_payload) {
  let payload = _payload;
  if (typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }

  const plStream = new stream.Readable({
    encoding: 'utf8',
  });
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

function get(hash) {
  return ipfs.get(hash).then(files =>
    new Promise((resolve, reject) => {
      let buf = '';
      files.on('data', file => {
        file.content.on('data', data => {
          buf += data.toString();
        });
        // file.content.on('error', fileErr => reject(fileErr));
        file.content.on('end', () => buf);
      });
      files.on('error', filesErr => reject(filesErr));
      files.on('end', () => {
        try {
          return resolve(JSON.parse(buf));
        } catch (e) {
          console.log(buf);
          return reject(e);
        }
      });
    })
  );
}

module.exports = { push, get };
