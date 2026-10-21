import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const TOAST_TIME = 3500;

// The admin session for every admin page: the totals (null once signed out), one way to call
// /api/admin that notices a lapsed session, and the short confirmations ("toasts") after changes.
export default function useAdmin() {
  const [overview, setOverview] = useState(undefined); // undefined while checking, null when signed out
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [toast, setToast] = useState(null);

  const request = useCallback(async (path, options) => {
    try {
      return await api(`/admin${path}`, options);
    } catch (failure) {
      if (failure.status === 401) setOverview(null);
      throw failure;
    }
  }, []);

  const refresh = useCallback(() => request('/overview').then(
    data => {
      setOverview(data);
      setError('');
      setRefreshedAt(new Date());
    },
    failure => {
      if (failure.status === 401) return;
      setError(failure.message);
      setOverview(current => (current === undefined ? null : current)); // A failed first load shows sign-in, with the reason.
    },
  ), [request]);

  useEffect(() => { refresh(); }, [refresh]);

  const notify = useCallback((message, tone = 'success') => setToast({ message, tone, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), TOAST_TIME);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const signIn = useCallback(async credentials => {
    await api('/admin/login', { method: 'POST', body: credentials });
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await api('/admin/logout', { method: 'POST', body: {} }).catch(() => {});
    setOverview(null);
    setError('');
  }, []);

  return { overview, error, refreshedAt, toast, request, refresh, notify, signIn, signOut };
}
