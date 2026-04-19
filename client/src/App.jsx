import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReviewDetail from './pages/ReviewDetail';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="reviews/:id" element={<ReviewDetail />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
