/**
 * Get deployed contract AMI and address
 */
const { Notifier } = require('../contract/.deployed');

console.log('[ Notifier contract ]');
console.log(`Address: ${Notifier.address}`);
console.log(`JSON interface:\n${JSON.stringify(Notifier.abi)}`);
