/**
 * Override any of the following values at config/local.js
 *
 * or as other files named at
 * https://github.com/lorenwest/node-config/wiki/Configuration-Files
 */
module.exports = {

  /**
   * Configuration for service provider
   */
  provider: {
    sqliteDatabase: './serverdb.sqlite3',
    ethUsd: 12.5, // 1 ETH = ? USD

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

    ipfs: {
      node: '/ip4/127.0.0.1/tcp/5001',
    },

    rsa: {
      private: './keys/privkey.pem',
      public: './keys/pubkey.pem',
    },

    ethereum: {
      adminAccount: 0, // i-th account in web3 is admin account
    },
  },

  /**
   * Configuration for client HTTP-Ethereum bridge server
   */
  client: {
    ethereum: {
      account: 1, // int or string (int: i-th acc in web3, string: actual address)
    },

    sms: {
      to: '+6598318407',
      message: `你好。Hello from Ethereum blockchain. This is an alert. This message is initiated on ${new Date().toISOString()}.`,
      ether: 0.03, // default eth to depsit (must be > 0.03 for first call)
    },

    // For Flic's HTTP server
    http: {
      port: 3000,
    },

    ipfs: {
      node: '/ip4/127.0.0.1/tcp/5001',
    },

    /**
     * Enabling of extended function calls
     */
    extended: {
      xipfs: false,
      encrypted: false,
    },
  },
};
