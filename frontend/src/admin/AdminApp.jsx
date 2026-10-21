import { useEffect, useState } from 'react';
import AdminLayout from './components/AdminLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { LOGIN_PATH, adminPage } from './routes.js';
import useAdmin from './useAdmin.js';
import '../styles/admin.css';

// After signing in, back to the admin page that was asked for (only ever an /admin page).
function pageAfterSignIn() {
  const next = new URLSearchParams(window.location.search).get('next') ?? '';
  return adminPage(next) ? next : '/admin';
}

// Everything under /admin. Signed out, every admin page sends you to /admin/login, which brings
// you back once you're in. Signed in, each path has its own page inside the admin layout.
export default function AdminApp({ app }) {
  const admin = useAdmin();
  const [version, setVersion] = useState(0); // "Refresh" bumps it so the open page loads again
  const { pathname, navigate } = app;
  const checking = admin.overview === undefined;
  const signedIn = Boolean(admin.overview);
  const page = adminPage(pathname);

  useEffect(() => {
    if (checking) return;
    if (!signedIn && pathname !== LOGIN_PATH) navigate(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`, { replace: true });
    else if (signedIn && pathname === LOGIN_PATH) navigate(pageAfterSignIn(), { replace: true });
    else if (signedIn && !page) navigate('/admin', { replace: true });
  }, [checking, signedIn, pathname, page, navigate]);

  if (checking) return <div className="ap-boot" role="status"><span className="ap-spinner" aria-hidden="true" />Opening the admin panel…</div>;
  if (!signedIn) return <LoginPage message={admin.error} onSignIn={admin.signIn} />;
  if (!page) return null; // On its way to /admin.

  const { Page } = page;
  function refreshAll() {
    setVersion(current => current + 1);
    admin.refresh();
  }
  return (
    <AdminLayout page={page} admin={admin} onRefresh={refreshAll}>
      <Page key={`${page.path}-${version}`} admin={admin} />
    </AdminLayout>
  );
}
