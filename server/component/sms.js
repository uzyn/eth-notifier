const config = require('config');
const twilio = require('twilio')(
  config.get('twilio.accountSid'),
  config.get('twilio.authToken')
);

const messagingServiceSid = config.get('twilio.messagingServiceSid');

/**
 * Sends an SMS to destination with message
 */
function send(destination, message) {
  return new Promise((resolve, reject) => {
    twilio.sendMessage({
      messagingServiceSid,
      to: destination,
      body: message,
      maxPrice: config.get('twilio.maxUsdPerSms'),
    }, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

/**
 * Get status of a message
 * mainly to get delivery status and pricing
 */
function status(twilioSid) {
  //twilio.messages(
  //console.log(
  console.log('status', twilioSid);
}

module.exports = { send, status };

// send('+6598318407', 'hello from blockchain');

/*
twilio.sendMessage({
  messagingServiceSid,
  to: '+6598318407',
  body: 'hello from twilio',
}, (err, message) => {
  console.log(err);
  console.log(message);
});
*/
