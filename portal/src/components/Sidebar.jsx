import { NavLink, Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import StatusPill from './StatusPill.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/format.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/calls', label: 'Call Logs', icon: 'phone' },
  { to: '/appointments', label: 'Appointments', icon: 'calendar' },
  { to: '/agent', label: 'AI Agent Settings', icon: 'bot' },
  { to: '/billing', label: 'Billing', icon: 'card' },
];

export default function Sidebar({ open, onNavigate }) {
  const { user, company, logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <Icon name="wave" size={19} />
        </div>
        <div>
          <div className="brand-name">Voxa</div>
          <div className="brand-sub">AI Receptionist</div>
        </div>
      </div>

      <nav className="nav" aria-label="Main">
        <div className="nav-label">Workspace</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="plan-card">
          <div className="workspace" title={company?.name}>
            {company?.name || 'Your company'}
          </div>
          <div className="plan-meta">
            <StatusPill value={company?.subscription_status} />
            <Link to="/billing" onClick={onNavigate}>
              Manage
            </Link>
          </div>
        </div>

        <div className="user-row">
          <div className="avatar">{initials(user?.name)}</div>
          <div className="user-meta">
            <div className="user-name">{user?.name}</div>
            <div className="user-mail">{user?.email}</div>
          </div>
          <button className="icon-btn" onClick={logout} title="Sign out" aria-label="Sign out">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
