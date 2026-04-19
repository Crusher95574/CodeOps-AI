const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const crypto = require('crypto');

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

function verifySignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = `sha256=${hmac.digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  const headers = event.headers || {};
  const githubEvent = headers['x-github-event'] || headers['X-GitHub-Event'];
  const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
  const body = event.body || '';

  if (process.env.GITHUB_WEBHOOK_SECRET) {
    if (!verifySignature(body, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
    }
  }

  const payload = JSON.parse(body);

  if (githubEvent === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
    const { pull_request: pr, repository, installation } = payload;

    const message = {
      reviewId: null,
      installationId: installation?.id?.toString(),
      owner: repository.owner.login,
      repo: repository.name,
      repoFullName: repository.full_name,
      pullNumber: pr.number,
      prTitle: pr.title,
      prUrl: pr.html_url,
      prAuthor: pr.user.login,
      commitSha: pr.head.sha,
      language: repository.language,
    };

    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.AWS_SQS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
    }));

    console.log(`Enqueued review for PR #${pr.number} in ${repository.full_name}`);
  }

  return { statusCode: 202, body: JSON.stringify({ received: true }) };
};
