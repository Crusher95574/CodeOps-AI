import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';

function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 p-3 hover:bg-gray-800/50 transition-colors text-left"
      >
        <SeverityBadge severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200">{finding.message}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">
            {finding.file}{finding.line ? `:${finding.line}` : ''}
            <span className="ml-2 text-gray-600">[{finding.agent}]</span>
          </p>
        </div>
        <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && finding.suggestion && (
        <div className="px-3 pb-3 border-t border-gray-800 bg-gray-900/50">
          <p className="text-xs text-gray-400 mt-2 font-medium mb-1">Suggestion</p>
          <p className="text-sm text-gray-300">{finding.suggestion}</p>
          {finding.testStub && (
            <>
              <p className="text-xs text-gray-400 mt-3 font-medium mb-1">Test stub</p>
              <pre className="text-xs bg-gray-950 text-green-400 p-3 rounded-lg overflow-x-auto">{finding.testStub}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    api.get(`/api/reviews/${id}`).then(r => setReview(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-gray-500">Loading review...</div>;
  if (!review) return <div className="p-6 text-gray-500">Review not found.</div>;

  const severities = ['all', 'critical', 'high', 'medium', 'low', 'info'];
  const findings = severityFilter === 'all'
    ? review.findings
    : review.findings.filter(f => f.severity === severityFilter);

  const counts = {};
  for (const f of review.findings) counts[f.severity] = (counts[f.severity] || 0) + 1;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-4">
        ← Back to dashboard
      </Link>

      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500 font-mono">#{review.prNumber}</span>
              <StatusBadge status={review.status} />
            </div>
            <h1 className="text-lg font-semibold text-white">{review.prTitle}</h1>
            <p className="text-xs text-gray-500 mt-1">
              {review.repoFullName} · by {review.prAuthor}
              {review.prUrl && <a href={review.prUrl} target="_blank" rel="noreferrer" className="ml-2 text-indigo-400 hover:underline">View on GitHub ↗</a>}
            </p>
          </div>
          {review.status === 'completed' && (
            <div className="text-center shrink-0">
              <div className={`text-3xl font-bold ${review.severityScore > 60 ? 'text-red-400' : review.severityScore > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                {review.severityScore}
              </div>
              <div className="text-xs text-gray-500">severity score</div>
            </div>
          )}
        </div>

        {review.summary && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 font-medium mb-1">AI Summary</p>
            <p className="text-sm text-gray-300">{review.summary}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
          {review.filesChanged?.length > 0 && <span>{review.filesChanged.length} files changed</span>}
          {review.diffSize && <span>{(review.diffSize / 1000).toFixed(1)}KB diff</span>}
          {review.processingTimeMs && <span>Processed in {(review.processingTimeMs / 1000).toFixed(1)}s</span>}
        </div>
      </div>

      {/* Findings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-300">{review.findings.length} findings</h2>
        <div className="flex gap-1 flex-wrap">
          {severities.map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${severityFilter === s ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}
            >
              {s}{s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-green-400 font-medium">No issues found</p>
          <p className="text-gray-500 text-sm mt-1">This PR looks clean for the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {findings.map((f, i) => <FindingCard key={i} finding={f} />)}
        </div>
      )}
    </div>
  );
}
