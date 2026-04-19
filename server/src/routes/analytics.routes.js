const express = require('express');
const router = express.Router();
const Review = require('../models/Review.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/analytics/summary?repo=owner/name
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { repo } = req.query;
    const filter = { status: 'completed' };
    if (repo) filter.repoFullName = repo;

    const [total, avgScore, byType, bySeverity, recentTrend] = await Promise.all([
      Review.countDocuments(filter),
      Review.aggregate([{ $match: filter }, { $group: { _id: null, avg: { $avg: '$severityScore' } } }]),
      Review.aggregate([
        { $match: filter },
        { $unwind: '$findings' },
        { $group: { _id: '$findings.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Review.aggregate([
        { $match: filter },
        { $unwind: '$findings' },
        { $group: { _id: '$findings.severity', count: { $sum: 1 } } },
      ]),
      Review.find(filter)
        .sort({ createdAt: -1 })
        .limit(14)
        .select('createdAt severityScore findings')
        .lean(),
    ]);

    res.json({
      totalReviews: total,
      avgSeverityScore: Math.round(avgScore[0]?.avg || 0),
      byType,
      bySeverity,
      recentTrend: recentTrend.reverse().map(r => ({
        date: r.createdAt,
        score: r.severityScore,
        issues: r.findings?.length || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/top-issues?repo=
router.get('/top-issues', authMiddleware, async (req, res) => {
  try {
    const { repo } = req.query;
    const filter = { status: 'completed' };
    if (repo) filter.repoFullName = repo;

    const topIssues = await Review.aggregate([
      { $match: filter },
      { $unwind: '$findings' },
      { $group: { _id: { type: '$findings.type', severity: '$findings.severity' }, count: { $sum: 1 }, sample: { $first: '$findings.message' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ topIssues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
