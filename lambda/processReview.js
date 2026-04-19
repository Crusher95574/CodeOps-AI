const { MongoClient, ObjectId } = require('mongodb');
const { orchestrateReview } = require('./agents/orchestrator');
const { getPRDiff, getPRFiles, postReviewComment } = require('./services/github.service');

let mongoClient;

async function getDB() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db('codeops');
}

exports.handler = async (event) => {
  const db = await getDB();
  const reviews = db.collection('reviews');
  const repos = db.collection('repositories');

  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    const { installationId, owner, repo, repoFullName, pullNumber, prTitle, commitSha, language } = payload;

    let reviewId = payload.reviewId;

    try {
      if (!reviewId) {
        const { insertedId } = await reviews.insertOne({
          prNumber: pullNumber,
          prTitle,
          prUrl: payload.prUrl,
          prAuthor: payload.prAuthor,
          repoFullName,
          commitSha,
          status: 'processing',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        reviewId = insertedId.toString();
      } else {
        await reviews.updateOne({ _id: new ObjectId(reviewId) }, { $set: { status: 'processing', updatedAt: new Date() } });
      }

      console.log(`[Lambda] Processing review ${reviewId} for PR #${pullNumber}`);

      const [diff, files] = await Promise.all([
        getPRDiff(installationId, owner, repo, pullNumber),
        getPRFiles(installationId, owner, repo, pullNumber),
      ]);

      const result = await orchestrateReview({ diff, prTitle, language });
      const commentData = await postReviewComment(installationId, owner, repo, pullNumber, result.comment);

      await reviews.updateOne(
        { _id: new ObjectId(reviewId) },
        {
          $set: {
            status: 'completed',
            findings: result.findings,
            summary: result.summary,
            severityScore: result.severityScore,
            agentResults: result.agentResults,
            processingTimeMs: result.processingTimeMs,
            filesChanged: files.map(f => f.filename),
            diffSize: diff.length,
            githubCommentId: commentData.id,
            updatedAt: new Date(),
          },
        }
      );

      await repos.updateOne(
        { owner, name: repo },
        { $inc: { totalReviews: 1 }, $set: { avgSeverityScore: result.severityScore, updatedAt: new Date() } }
      );

      console.log(`[Lambda] Review ${reviewId} completed. Score: ${result.severityScore}`);
    } catch (err) {
      console.error(`[Lambda] Review ${reviewId} failed:`, err);
      if (reviewId) {
        await reviews.updateOne(
          { _id: new ObjectId(reviewId) },
          { $set: { status: 'failed', error: err.message, updatedAt: new Date() } }
        );
      }
    }
  }
};
