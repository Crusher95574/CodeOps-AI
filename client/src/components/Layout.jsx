import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected, events } = useWebSocket();

  const latestEvent = events[0];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">C</div>
            <span className="font-semibold text-white">CodeOps AI</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`
            }
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Dashboard
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`
            }
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </NavLink>
        </nav>

        {/* Live status */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-600'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
          {latestEvent && (
            <div className="text-xs text-gray-500 truncate">
              {latestEvent.type === 'review:completed' && `✅ PR #${latestEvent.data.prNumber} reviewed`}
              {latestEvent.type === 'review:processing' && `⚙️ Processing review...`}
              {latestEvent.type === 'review:queued' && `📥 Review queued`}
              {latestEvent.type === 'review:failed' && `❌ Review failed`}
            </div>
          )}
        </div>

        {/* User */}
        <div className="p-3 border-t border-gray-800 flex items-center gap-3">
          {user?.avatarUrl && <img src={user.avatarUrl} className="w-7 h-7 rounded-full" alt="avatar" />}
          <span className="text-sm text-gray-300 flex-1 truncate">{user?.username}</span>
          <button onClick={logout} className="text-gray-600 hover:text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
