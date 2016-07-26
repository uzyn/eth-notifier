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
  },
};
