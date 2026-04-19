const express = require('express');
const router = express.Router();
const Repository = require('../models/Repository.model');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const repos = await Repository.find().sort({ updatedAt: -1 }).lean();
    res.json({ repos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:fullName(*)', authMiddleware, async (req, res) => {
  try {
    const repo = await Repository.findOne({ fullName: req.params.fullName }).lean();
    if (!repo) return res.status(404).json({ error: 'Repository not found' });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
