/**
 * Override any of the following values at config/local.js
 *
 * or as other files named at
 * https://github.com/lorenwest/node-config/wiki/Configuration-Files
 */
module.exports = {

  /**
   * AWS access key with AmazonS SNS access
   * to send SMS
   */
  aws: {
    region: 'us-west-2',
    accessKeyId: 'AXXXXXXXXXXXXXXXXX',
    secretAccessKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
};
