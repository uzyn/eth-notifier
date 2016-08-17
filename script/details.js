/**
 * Get deployed contract AMI and address
 */
const { Notifier } = require('../build/.server/contracts.js');

console.log('[ Notifier contract ]');
console.log(`Address: ${Notifier.address}`);
console.log(`JSON interface:\n${JSON.stringify(Notifier.abi)}`);

