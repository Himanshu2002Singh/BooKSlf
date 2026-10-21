import { useState } from 'react';
import usePageTitle from '../../app/usePageTitle.js';
import FlowShell from '../../components/FlowShell.jsx';
import Icon from '../components/Icon.jsx';

// /admin/login — same frame as the readers' sign-in page. The admin's email and password are
// set on the server (ADMIN_EMAIL and ADMIN_PASSWORD).
export default function LoginPage({ message = '', onSignIn }) {
  usePageTitle('Admin sign in');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(message);
  const [busy, setBusy] = useState(false);

  const update = field => event => {
    setForm(current => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  async function submit(event) {
    event.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Enter the admin email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSignIn({ email: form.email.trim(), password: form.password });
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <FlowShell navRight={<a className="fg-nav-link" href="/">Back to the site</a>}>
      <form className="fg-auth ap-signin" onSubmit={submit} noValidate aria-busy={busy}>
        <div className="fg-head">
          <span className="ap-signin__badge"><Icon name="lock" size={13} />Admin</span>
          <h1>Welcome back</h1>
          <p>Sign in to look after readers, prices, messages and reviews.</p>
        </div>
        <div className="fields">
          <div>
            <label className="lbl" htmlFor="admin-email">Email address</label>
            <input id="admin-email" className="fg-input" type="email" autoComplete="username" value={form.email} onChange={update('email')} aria-describedby={error ? 'admin-error' : undefined} />
          </div>
          <div>
            <label className="lbl" htmlFor="admin-password">Password</label>
            <div className="ap-password">
              <input id="admin-password" className="fg-input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={update('password')} aria-describedby={error ? 'admin-error' : undefined} />
              <button type="button" onClick={() => setShowPassword(shown => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </div>
        </div>
        {error && <p id="admin-error" role="alert" className="err">{error}</p>}
        <button type="submit" className="fg-cta" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </FlowShell>
  );
}
