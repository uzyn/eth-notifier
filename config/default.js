/**
 * Override any of the following values at config/local.js
 *
 * or as other files named at
 * https://github.com/lorenwest/node-config/wiki/Configuration-Files
 */
module.exports = {

  /**
   * Twilio account details
   *
   * For messaging service SID, create a messaging service at
   * https://www.twilio.com/user/account/messaging/services
   * and assign the numbers
   */
  twilio: {
    accountSid: 'xxxxxxxxxxxxxxxxxxxxxxx',
    authToken: 'xxxxxxxxxxxxxxxxxxxxxxx',
    messagingServiceSid: 'xxxxxxxxxxxxxxxxxxxxxxx',
    maxUsdPerSms: 0.5, // This should be less than the amount withhold by Notifier.sol
  },
  server: {
    sqliteDatabase: './serverdb.sqlite3',
    ethUsd: 11, // 1 ETH = ? USD
  },
  ethereum: {
    adminAccount: 0, // i-th account in web3 is admin account
  },

  client: {
    account: 3, // int or string (int: i-th acc in web3, string: actual address)
    sms: {
      to: '+6598318407',
      message: `你好。Hello from blockchain. This message is initiated on ${new Date().toISOString()}.`,
      ether: 0.03, // default eth to depsit (must be > 0.03 for first call)
    },

    // For Flic's HTTP server
    http: {
      port: 3000,
    },
  },
};
