const config = require('config');
const twilio = require('twilio')(
  config.get('twilio.accountSid'),
  config.get('twilio.authToken')
);

const messagingServiceSid = config.get('twilio.messagingServiceSid');

twilio.sendMessage({
  messagingServiceSid,
  to: '+6598318407',
  body: 'hello from twilio',
}, (err, message) => {
  console.log(err);
  console.log(message);
});
