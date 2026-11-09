import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, company: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    api('/api/auth/me')
      .then((data) => {
        if (!cancelled) setState({ user: data.user, company: data.company, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, company: null, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    setState({ user: data.user, company: data.company, loading: false });
    return data;
  }, []);

  const signup = useCallback(async (payload) => {
    const data = await api('/api/auth/signup', { method: 'POST', body: payload });
    setState({ user: data.user, company: data.company, loading: false });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setState({ user: null, company: null, loading: false });
    }
  }, []);

  const setCompany = useCallback((company) => {
    setState((prev) => ({ ...prev, company }));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, signup, logout, setCompany }),
    [state, login, signup, logout, setCompany]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
