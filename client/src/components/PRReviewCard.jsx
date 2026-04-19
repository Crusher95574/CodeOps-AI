import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

function ScoreRing({ score }) {
  const color = score > 60 ? '#ef4444' : score > 30 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex flex-col items-center">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#374151" strokeWidth="4" />
        <circle
          cx="22" cy="22" r="18" fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * 113} 113`}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="600" fill={color}>{score}</text>
      </svg>
      <span className="text-xs text-gray-500 mt-0.5">score</span>
    </div>
  );
}

export default function PRReviewCard({ review }) {
  const critical = review.findings?.filter(f => f.severity === 'critical').length || 0;
  const high = review.findings?.filter(f => f.severity === 'high').length || 0;
  const total = review.findings?.length || 0;

  return (
    <Link to={`/reviews/${review._id}`} className="card flex items-center gap-4 hover:border-gray-700 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500 font-mono">#{review.prNumber}</span>
          <StatusBadge status={review.status} />
        </div>
        <p className="text-sm font-medium text-gray-100 truncate group-hover:text-indigo-300 transition-colors">{review.prTitle}</p>
        <p className="text-xs text-gray-500 mt-1">{review.repoFullName} · {review.prAuthor}</p>
        <div className="flex items-center gap-3 mt-2">
          {critical > 0 && <span className="text-xs text-red-400">{critical} critical</span>}
          {high > 0 && <span className="text-xs text-orange-400">{high} high</span>}
          {total > 0 && <span className="text-xs text-gray-500">{total} total issues</span>}
          {review.processingTimeMs && (
            <span className="text-xs text-gray-600">{(review.processingTimeMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      </div>
      {review.status === 'completed' && <ScoreRing score={review.severityScore || 0} />}
    </Link>
  );
}
