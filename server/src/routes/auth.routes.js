const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Octokit } = require('@octokit/rest');
const User = require('../models/User.model');
const authMiddleware = require('../middleware/auth.middleware');

// Step 1: Redirect to GitHub OAuth
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'user:email read:user',
    redirect_uri: `${process.env.SERVER_URL || 'http://localhost:3001'}/api/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${process.env.CLIENT_URL}?error=no_code`);

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    const octokit = new Octokit({ auth: tokenData.access_token });
    const { data: ghUser } = await octokit.rest.users.getAuthenticated();

    let user = await User.findOne({ githubId: ghUser.id.toString() });
    if (!user) {
      user = await User.create({
        githubId: ghUser.id.toString(),
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
        email: ghUser.email,
        accessToken: tokenData.access_token,
      });
    } else {
      user.accessToken = tokenData.access_token;
      user.avatarUrl = ghUser.avatar_url;
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect(`${process.env.CLIENT_URL}?error=oauth_failed`);
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
