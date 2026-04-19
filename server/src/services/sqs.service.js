const { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.NODE_ENV === 'development' && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
    },
  }),
});

const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL;

async function enqueueReview(payload) {
  if (!QUEUE_URL) {
    console.warn('SQS_QUEUE_URL not set — skipping SQS, processing inline');
    return null;
  }
  const cmd = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      eventType: { DataType: 'String', StringValue: 'pr_review' },
    },
  });
  return client.send(cmd);
}

async function receiveMessages(maxMessages = 1) {
  const cmd = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: maxMessages,
    WaitTimeSeconds: 20,
    MessageAttributeNames: ['All'],
  });
  const response = await client.send(cmd);
  return response.Messages || [];
}

async function deleteMessage(receiptHandle) {
  const cmd = new DeleteMessageCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle,
  });
  return client.send(cmd);
}

module.exports = { enqueueReview, receiveMessages, deleteMessage };
