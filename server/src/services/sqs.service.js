const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL;

const client = QUEUE_URL ? new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}) : null;

async function enqueueReview(payload) {
  if (!QUEUE_URL || !client) {
    console.log('SQS not configured — processing inline');
    return null;
  }
  const cmd = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
  });
  return client.send(cmd);
}

module.exports = { enqueueReview };
