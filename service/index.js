const AWS = require('aws-sdk');
const config = require('config');
AWS.config.update(config.get('aws'));

const sns = new AWS.SNS();

const params = {
  PhoneNumber: '+6598318407',
  Message: 'Hello U-Zyn',
  MessageAttributes: {
    'AWS.SNS.SMS.SenderID': {
      DataType: 'String',
      StringValue: 'APAPAP',
    },
    'AWS.SNS.SMS.SMSType': {
      DataType: 'String',
      StringValue: 'Promotional',
    },
  },
};

sns.publish(params, (err, data) => {
  console.log(err);
  console.log(data);
});

