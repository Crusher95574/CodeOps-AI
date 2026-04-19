export default function MetricCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
