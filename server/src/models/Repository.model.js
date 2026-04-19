const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  githubId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  owner: String,
  private: { type: Boolean, default: false },
  installationId: String,
  language: String,
  totalReviews: { type: Number, default: 0 },
  avgSeverityScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Repository', repositorySchema);
