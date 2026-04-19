import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../services/api';
import MetricCard from '../components/MetricCard';

const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', info: '#6b7280' };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [topIssues, setTopIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/summary'),
      api.get('/api/analytics/top-issues'),
    ]).then(([r1, r2]) => {
      setData(r1.data);
      setTopIssues(r2.data.topIssues);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading analytics...</div>;
  if (!data) return <div className="p-6 text-gray-500">No analytics data yet.</div>;

  const trendData = data.recentTrend.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: d.score,
    issues: d.issues,
  }));

  const severityData = data.bySeverity.map(s => ({
    name: s._id,
    count: s.count,
    color: SEVERITY_COLORS[s._id] || '#6b7280',
  }));

  const typeData = data.byType.slice(0, 6).map(t => ({ name: t._id, count: t.count }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Code quality trends across all repositories</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total reviews" value={data.totalReviews} />
        <MetricCard label="Avg severity score" value={data.avgSeverityScore}
          color={data.avgSeverityScore > 60 ? 'text-red-400' : data.avgSeverityScore > 30 ? 'text-yellow-400' : 'text-green-400'} />
        <MetricCard label="Total findings" value={data.bySeverity.reduce((s, x) => s + x.count, 0)} />
        <MetricCard label="Critical" value={data.bySeverity.find(s => s._id === 'critical')?.count || 0} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Score trend */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Severity score trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-sm text-center py-10">No trend data yet</p>
          )}
        </div>

        {/* Severity breakdown */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Findings by severity</h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-sm text-center py-10">No findings yet</p>
          )}
        </div>
      </div>

      {/* Issue types breakdown */}
      <div className="card mb-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Findings by type</h3>
        {typeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} width={100} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-600 text-sm text-center py-8">No data yet</p>
        )}
      </div>

      {/* Top recurring issues */}
      {topIssues.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Top recurring issues</h3>
          <div className="space-y-2">
            {topIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-gray-600 w-5 text-right text-xs">{i + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLORS[issue._id?.severity] ? '' : 'bg-gray-800 text-gray-400'}`}
                  style={{ background: SEVERITY_COLORS[issue._id?.severity] + '33', color: SEVERITY_COLORS[issue._id?.severity] }}>
                  {issue._id?.severity}
                </span>
                <span className="text-gray-400 flex-1 truncate">{issue._id?.type}</span>
                <span className="text-gray-600 text-xs shrink-0">{issue.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
