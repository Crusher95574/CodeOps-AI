import { useWebSocket } from '../hooks/useWebSocket';

const EVENT_LABELS = {
  'review:queued':     { label: 'Review queued',     color: 'text-gray-400' },
  'review:processing': { label: 'Processing...',      color: 'text-blue-400' },
  'review:completed':  { label: 'Review complete',    color: 'text-green-400' },
  'review:failed':     { label: 'Review failed',      color: 'text-red-400' },
};

export default function LiveFeed() {
  const { events, connected } = useWebSocket();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-300">Live Feed</h2>
        <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-400' : 'text-gray-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-6">Waiting for PR events...</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.map((ev, i) => {
            const meta = EVENT_LABELS[ev.type] || { label: ev.type, color: 'text-gray-400' };
            return (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-gray-600 font-mono shrink-0">
                  {new Date(ev.ts).toLocaleTimeString()}
                </span>
                <span className={`font-medium shrink-0 ${meta.color}`}>{meta.label}</span>
                {ev.data?.findingsCount !== undefined && (
                  <span className="text-gray-500">{ev.data.findingsCount} issues · score {ev.data.severityScore}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
