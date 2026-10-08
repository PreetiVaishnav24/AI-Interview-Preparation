import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { AuthContext, useAuth } from './auth.js';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewInterview from './pages/NewInterview.jsx';
import Session from './pages/Session.jsx';
import Report from './pages/Report.jsx';
import History from './pages/History.jsx';

function Shell({ children }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Interview Prep</Link>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/new">New interview</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
        <div className="who">
          <span>{user.name}</span>
          <button className="link" onClick={() => { signOut(); nav('/login'); }}>Sign out</button>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const { user } = await api.me();
    setUser(user);
  }, []);

  useEffect(() => {
    (localStorage.getItem('token') ? refreshUser().catch(() => localStorage.removeItem('token')) : Promise.resolve()).finally(() => setReady(true));
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [refreshUser]);

  const signIn = ({ token, user }) => {
    localStorage.setItem('token', token);
    setUser(user);
  };
  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!ready) return <div className="center muted">Loading…</div>;

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, refreshUser }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth mode="login" />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Auth mode="register" />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/new" element={<Protected><NewInterview /></Protected>} />
        <Route path="/interview/:id" element={<Protected><Session /></Protected>} />
        <Route path="/report/:id" element={<Protected><Report /></Protected>} />
        <Route path="/history" element={<Protected><History /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
