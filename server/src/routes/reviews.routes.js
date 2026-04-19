const express = require('express');
const router = express.Router();
const Review = require('../models/Review.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/reviews — list reviews with filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { repo, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (repo) filter.repoFullName = repo;
    if (status) filter.status = status;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(filter),
    ]);

    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/:id/findings
router.get('/:id/findings', authMiddleware, async (req, res) => {
  try {
    const { severity, type } = req.query;
    const review = await Review.findById(req.params.id).select('findings prTitle prNumber').lean();
    if (!review) return res.status(404).json({ error: 'Review not found' });

    let findings = review.findings;
    if (severity) findings = findings.filter(f => f.severity === severity);
    if (type) findings = findings.filter(f => f.type === type);

    res.json({ findings, prTitle: review.prTitle, prNumber: review.prNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
