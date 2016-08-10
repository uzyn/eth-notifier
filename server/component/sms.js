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
