/**
 * Decrypt xipfs content
 */
const config = require('config');
const crypto = require('crypto');
const fs = require('fs');

function decrypt(ipfsData) {
  if (!ipfsData.cipher) {
    throw new Error('Cipher not found.');
  }

  /**
   *  Step 1: Obtain symmetric key and IV
   */
  const privateKey = fs.readFileSync(config.get('provider.rsa.private'), 'utf8');
  const symmetricKey = crypto.privateDecrypt(privateKey, Buffer.from(ipfsData.key, 'base64'));
  const iv = crypto.privateDecrypt(privateKey, Buffer.from(ipfsData.iv, 'base64'));

  /**
   * Step 2: Decrypt data with symmetric key
   */
  const decipher = crypto.createDecipheriv(ipfsData.cipher, symmetricKey, iv);
  let decoded = decipher.update(ipfsData.data, 'base64', 'utf8');
  decoded += decipher.final('utf8');

  return JSON.parse(decoded);
}

module.exports = decrypt;
