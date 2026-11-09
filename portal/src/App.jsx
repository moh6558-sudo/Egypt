import { useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CallLogs from './pages/CallLogs.jsx';
import Appointments from './pages/Appointments.jsx';
import AgentSettings from './pages/AgentSettings.jsx';
import Billing from './pages/Billing.jsx';

const ROUTE_META = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'How your AI receptionist performed over the last 30 days.',
  },
  '/calls': {
    title: 'Call Logs',
    subtitle: 'Every answered call, with summary, transcript and outcome.',
  },
  '/appointments': {
    title: 'Appointments',
    subtitle: 'Bookings captured by your agent and their current status.',
  },
  '/agent': {
    title: 'AI Agent Settings',
    subtitle: 'Teach your receptionist how to greet, answer and route callers.',
  },
  '/billing': {
    title: 'Billing',
    subtitle: 'Your plan, this month’s usage and monthly statements.',
  },
};

function Splash() {
  return (
    <div className="splash">
      <div className="spinner" />
      <span>Loading your workspace…</span>
    </div>
  );
}

function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || ROUTE_META['/dashboard'];

  return (
    <div className="shell">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen ? <div className="sidebar-scrim" onClick={() => setNavOpen(false)} /> : null}
      <div className="main">
        <Topbar title={meta.title} subtitle={meta.subtitle} onMenu={() => setNavOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<Protected />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/calls" element={<CallLogs />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/agent" element={<AgentSettings />} />
              <Route path="/billing" element={<Billing />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
