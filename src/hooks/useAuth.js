import { useState, useCallback } from 'react';

// Auth goes directly to the CF Worker (free, already deployed)
const WORKER = import.meta.env.VITE_WORKER_URL || 'https://femme-ai.swq-bms.workers.dev';

const ACCESS_KEY  = 'femme_access';
const REFRESH_KEY = 'femme_refresh';
const USER_KEY    = 'femme_user';

function getStored() {
  try {
    return {
      access:  localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
      user:    JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    };
  } catch {
    return { access: null, refresh: null, user: null };
  }
}

async function workerPost(task, data) {
  const res = await fetch(WORKER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, ...data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || json.error || 'Sunucu hatası');
  return json;
}

export function useAuth() {
  const stored = getStored();
  const [access,  setAccess]  = useState(stored.access);
  const [refresh, setRefresh] = useState(stored.refresh);
  const [user,    setUser]    = useState(stored.user);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const persist = useCallback((a, r, u) => {
    localStorage.setItem(ACCESS_KEY,  a);
    localStorage.setItem(REFRESH_KEY, r);
    localStorage.setItem(USER_KEY,    JSON.stringify(u));
    setAccess(a); setRefresh(r); setUser(u);
  }, []);

  // Email + password login (auto-registers on first use)
  const login = useCallback(async (email, password) => {
    setLoading(true); setError('');
    try {
      const data = await workerPost('auth_login', { email, password });
      persist(data.access, data.refresh, data.user);
      return true;
    } catch (e) {
      setError(e.message); return false;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  const refreshTokens = useCallback(async () => {
    if (!refresh) return false;
    try {
      const data = await workerPost('auth_refresh', { refresh });
      localStorage.setItem(ACCESS_KEY,  data.access);
      localStorage.setItem(REFRESH_KEY, data.refresh);
      setAccess(data.access); setRefresh(data.refresh);
      return true;
    } catch {
      logout(); return false;
    }
  }, [refresh]);

  const authFetch = useCallback(async (url, opts = {}) => {
    const doFetch = (token) => fetch(url, {
      ...opts,
      headers: { ...opts.headers, Authorization: `Bearer ${token}` },
    });
    let res = await doFetch(access);
    if (res.status === 401) {
      const ok = await refreshTokens();
      if (!ok) return res;
      res = await doFetch(localStorage.getItem(ACCESS_KEY));
    }
    return res;
  }, [access, refreshTokens]);

  const logout = useCallback(() => {
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(k => localStorage.removeItem(k));
    setAccess(null); setRefresh(null); setUser(null);
  }, []);

  return {
    user,
    isLoggedIn: !!access,
    loading,
    error,
    setError,
    login,
    logout,
    authFetch,
  };
}
