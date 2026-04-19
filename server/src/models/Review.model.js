const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  type: { type: String, enum: ['bug', 'security', 'style', 'complexity', 'test_gap', 'suggestion'] },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' },
  file: String,
  line: Number,
  endLine: Number,
  message: String,
  suggestion: String,
  agent: { type: String, enum: ['code_review', 'complexity', 'test_gap', 'synthesis'] },
});

const reviewSchema = new mongoose.Schema({
  prNumber: { type: Number, required: true },
  prTitle: String,
  prUrl: String,
  prAuthor: String,
  repoFullName: { type: String, required: true },
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
  commitSha: String,
  diffSize: Number,
  filesChanged: [String],

  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued',
  },

  findings: [findingSchema],
  summary: String,
  severityScore: { type: Number, default: 0 }, // 0-100, higher = more issues

  agentResults: {
    codeReview: mongoose.Schema.Types.Mixed,
    complexity: mongoose.Schema.Types.Mixed,
    testGap: mongoose.Schema.Types.Mixed,
  },

  processingTimeMs: Number,
  githubCommentId: Number,
  error: String,
}, { timestamps: true });

reviewSchema.index({ repoFullName: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });

module.exports = mongoose.model('Review', reviewSchema);
