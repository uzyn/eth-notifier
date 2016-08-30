const config = require('config');
const twilio = require('twilio')(
  config.get('provider.twilio.accountSid'),
  config.get('provider.twilio.authToken')
);

const messagingServiceSid = config.get('provider.twilio.messagingServiceSid');

/**
 * Sends an SMS to destination with message
 */
function send(destination, message) {
  return new Promise((resolve, reject) => {
    twilio.sendMessage({
      messagingServiceSid,
      to: destination,
      body: message,
      maxPrice: config.get('provider.twilio.maxUsdPerSms'),
    }, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

/**
 * Get status(es) of a message(s)
 * mainly to get delivery status and pricing
 */
function statuses(twilioSids) {
  let twilioSidsArray;
  if (typeof twilioSids === 'string') {
    twilioSidsArray = [twilioSids];
  } else {
    twilioSidsArray = twilioSids;
  }

  const promises = twilioSidsArray.map(twilioSid =>
    new Promise((resolve) => { // do not reject, just resolve(null)
      console.log(`Enquiring ${twilioSid}`);
      twilio.messages(twilioSid).get((err, message) => {
        if (err) {
          return resolve(null); // do not reject
        }
        return resolve(message);
      });
    })
  );
  return Promise.all(promises);
}

module.exports = { send, statuses };
