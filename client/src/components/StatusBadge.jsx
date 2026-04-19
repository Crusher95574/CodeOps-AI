export default function StatusBadge({ status }) {
  const map = {
    queued:     'bg-gray-800 text-gray-400 border-gray-700',
    processing: 'bg-blue-900/40 text-blue-300 border-blue-800',
    completed:  'bg-green-900/40 text-green-300 border-green-800',
    failed:     'bg-red-900/40 text-red-300 border-red-800',
  };
  const icons = { queued: '⏳', processing: '⚙️', completed: '✅', failed: '❌' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${map[status] || map.queued}`}>
      <span style={{ fontSize: 10 }}>{icons[status]}</span>
      {status}
    </span>
  );
}
