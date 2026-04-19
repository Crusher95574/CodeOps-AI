import { useState, useEffect } from 'react';
import api from '../services/api';
import PRReviewCard from '../components/PRReviewCard';
import LiveFeed from '../components/LiveFeed';
import MetricCard from '../components/MetricCard';

export default function Dashboard() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/api/reviews'),
      api.get('/api/analytics/summary'),
    ]).then(([r1, r2]) => {
      setReviews(r1.data.reviews);
      setSummary(r2.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered code reviews across your repositories</p>
      </div>

      {/* Metrics */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total reviews" value={summary.totalReviews} />
          <MetricCard
            label="Avg severity score"
            value={summary.avgSeverityScore}
            color={summary.avgSeverityScore > 60 ? 'text-red-400' : summary.avgSeverityScore > 30 ? 'text-yellow-400' : 'text-green-400'}
          />
          <MetricCard
            label="Critical issues"
            value={summary.bySeverity?.find(s => s._id === 'critical')?.count || 0}
            color="text-red-400"
          />
          <MetricCard
            label="Most common"
            value={summary.byType?.[0]?._id || '—'}
            sub={summary.byType?.[0] ? `${summary.byType[0].count} occurrences` : ''}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-300">Reviews</h2>
            <div className="flex gap-1">
              {['all', 'completed', 'processing', 'failed'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${filter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-800" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-sm">No reviews yet.</p>
              <p className="text-gray-600 text-xs mt-1">Open a PR on a connected repo to trigger your first review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => <PRReviewCard key={r._id} review={r} />)}
            </div>
          )}
        </div>

        {/* Live feed */}
        <div>
          <h2 className="text-sm font-medium text-gray-300 mb-3">Live Events</h2>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}
