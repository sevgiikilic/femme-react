import { useState, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL;
const ACCESS_KEY = 'femme_access';
const REFRESH_KEY = 'femme_refresh';
const USER_KEY = 'femme_user';

function getStored() {
  try {
    return {
      access: localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
      user: JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
    };
  } catch {
    return { access: null, refresh: null, user: null };
  }
}

export function useAuth() {
  const stored = getStored();
  const [access, setAccess] = useState(stored.access);
  const [refresh, setRefresh] = useState(stored.refresh);
  const [user, setUser] = useState(stored.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persist = useCallback((a, r, u) => {
    localStorage.setItem(ACCESS_KEY, a);
    localStorage.setItem(REFRESH_KEY, r);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setAccess(a); setRefresh(r); setUser(u);
  }, []);

  // Adım 1: email gönder → PIN maile gelsin
  const requestPin = useCallback(async (email) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/request-pin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.email?.[0] || 'Hata oluştu.');
      return true;
    } catch (e) {
      setError(e.message); return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Adım 2: PIN doğrula → token al
  const verifyPin = useCallback(async (email, pin) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/verify-pin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Geçersiz kod.');
      persist(data.access, data.refresh, data.user);
      return true;
    } catch (e) {
      setError(e.message); return false;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // Token yenile
  const refreshTokens = useCallback(async () => {
    if (!refresh) return false;
    try {
      const res = await fetch(`${API}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) { logout(); return false; }
      const data = await res.json();
      localStorage.setItem(ACCESS_KEY, data.access);
      if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
      setAccess(data.access);
      if (data.refresh) setRefresh(data.refresh);
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  // Authenticated fetch (otomatik token yenileme)
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

  const logout = useCallback(async () => {
    try {
      if (refresh) {
        await fetch(`${API}/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
          body: JSON.stringify({ refresh }),
        });
      }
    } catch {}
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(k => localStorage.removeItem(k));
    setAccess(null); setRefresh(null); setUser(null);
  }, [access, refresh]);

  return {
    user,
    isLoggedIn: !!access,
    loading,
    error,
    setError,
    requestPin,
    verifyPin,
    logout,
    authFetch,
  };
}
