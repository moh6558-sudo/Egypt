import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ company_name: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signup({
        company_name: form.company_name.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create the workspace');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <form className="auth-form" onSubmit={submit}>
        <div>
          <h1>Create your workspace</h1>
          <p className="lead" style={{ marginTop: 6 }}>
            One owner account and one private company workspace.
          </p>
        </div>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="field">
          <label htmlFor="company">Business name</label>
          <input
            id="company"
            className="input"
            placeholder="Northline Dental Studio"
            value={form.company_name}
            onChange={update('company_name')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            className="input"
            autoComplete="name"
            placeholder="Dana Whitmore"
            value={form.name}
            onChange={update('name')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={update('email')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">
            Password <span className="hint">at least 8 characters</span>
          </label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            value={form.password}
            onChange={update('password')}
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ height: 40 }}>
          {busy ? 'Creating…' : 'Create workspace'}
        </button>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
