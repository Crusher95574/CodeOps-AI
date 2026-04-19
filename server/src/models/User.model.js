const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: String,
  email: String,
  accessToken: String,
  installationId: String,
  repos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Repository' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
