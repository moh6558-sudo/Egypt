import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO = { email: 'demo@northline.ai', password: 'demo1234' };

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const run = async (mail, pass) => {
    setBusy(true);
    setError('');
    try {
      await login(mail, pass);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          run(email.trim(), password);
        }}
      >
        <div>
          <h1>Sign in</h1>
          <p className="lead" style={{ marginTop: 6 }}>Access your agency workspace.</p>
        </div>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="field">
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ height: 40 }}>
          {busy ? 'Signing in…' : 'Sign in'}
          {!busy ? <Icon name="chevron" size={16} style={{ transform: 'rotate(-90deg)' }} /> : null}
        </button>

        <div className="demo-card">
          <div className="demo-title">Demo workspace</div>
          <div className="demo-cred">
            {DEMO.email} · {DEMO.password}
          </div>
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy}
            onClick={() => run(DEMO.email, DEMO.password)}
          >
            Open demo account
          </button>
        </div>

        <div className="auth-switch">
          New here? <Link to="/signup">Create a workspace</Link>
        </div>
      </form>
    </AuthShell>
  );
}
