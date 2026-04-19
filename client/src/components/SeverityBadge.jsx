export default function SeverityBadge({ severity }) {
  const classes = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    info: 'badge-info',
  };
  const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵', info: '⚪' };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${classes[severity] || classes.info}`}>
      <span style={{ fontSize: 10 }}>{icons[severity] || '⚪'}</span>
      {severity}
    </span>
  );
}
