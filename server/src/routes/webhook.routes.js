const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Review = require('../models/Review.model');
const Repository = require('../models/Repository.model');
const { enqueueReview } = require('../services/sqs.service');
const { getPRDiff, getPRFiles, postReviewComment } = require('../services/github.service');
const { orchestrateReview } = require('../agents/orchestrator');

function verifyWebhookSignature(req) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(req.body);
  const digest = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
}

router.post('/', async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = JSON.parse(req.body.toString());

  res.status(202).json({ received: true });

  if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
    await handlePREvent(payload, req.app.get('io'));
  }
});

async function handlePREvent(payload, io) {
  const { pull_request: pr, repository, installation } = payload;
  const installationId = installation?.id?.toString();

  try {
    let repo = await Repository.findOne({ githubId: repository.id });
    if (!repo) {
      repo = await Repository.create({
        githubId: repository.id,
        name: repository.name,
        fullName: repository.full_name,
        owner: repository.owner.login,
        private: repository.private,
        installationId,
        language: repository.language,
      });
    }

    const review = await Review.create({
      prNumber: pr.number,
      prTitle: pr.title,
      prUrl: pr.html_url,
      prAuthor: pr.user.login,
      repoFullName: repository.full_name,
      repositoryId: repo._id,
      commitSha: pr.head.sha,
      status: 'queued',
    });

    io?.emit('review:queued', { reviewId: review._id, prNumber: pr.number, repoFullName: repository.full_name });

    const sqsPayload = {
      reviewId: review._id.toString(),
      installationId,
      owner: repository.owner.login,
      repo: repository.name,
      pullNumber: pr.number,
      prTitle: pr.title,
      commitSha: pr.head.sha,
      language: repository.language,
    };

    const sqsResult = await enqueueReview(sqsPayload);

    if (!sqsResult) {
      await processReviewInline(sqsPayload, io);
    }
  } catch (err) {
    console.error('[Webhook] Error handling PR event:', err);
  }
}

async function processReviewInline(payload, io) {
  const { reviewId, installationId, owner, repo, pullNumber, prTitle, commitSha, language } = payload;

  await Review.findByIdAndUpdate(reviewId, { status: 'processing' });
  io?.emit('review:processing', { reviewId });

  try {
    const [diff, files] = await Promise.all([
      getPRDiff(installationId, owner, repo, pullNumber),
      getPRFiles(installationId, owner, repo, pullNumber),
    ]);

    const filesChanged = files.map(f => f.filename);

    const result = await orchestrateReview({ diff, prTitle, language });

    const commentData = await postReviewComment(installationId, owner, repo, pullNumber, result.comment);

    await Review.findByIdAndUpdate(reviewId, {
      status: 'completed',
      findings: result.findings,
      summary: result.summary,
      severityScore: result.severityScore,
      agentResults: result.agentResults,
      processingTimeMs: result.processingTimeMs,
      filesChanged,
      diffSize: diff.length,
      githubCommentId: commentData.id,
    });

    await Repository.findOneAndUpdate(
      { owner, name: repo },
      { $inc: { totalReviews: 1 }, avgSeverityScore: result.severityScore }
    );

    io?.emit('review:completed', { reviewId, severityScore: result.severityScore, findingsCount: result.findings.length });
  } catch (err) {
    console.error('[Webhook] Review processing failed:', err);
    await Review.findByIdAndUpdate(reviewId, { status: 'failed', error: err.message });
    io?.emit('review:failed', { reviewId, error: err.message });
  }
}

module.exports = router;
module.exports.processReviewInline = processReviewInline;
