import { useEffect, useState } from 'react';
import { AUTH_BASE, asset } from '../../data/figmaAssets.js';
import FlowShell from '../../components/FlowShell.jsx';
import { preloadGoogle } from './google.js';

// Sign-up and sign-in screen (Google only).
// onGoogle is async and throws an Error whose message is shown to the reader.
export default function AuthForm({ mode = 'signup', onModeChange, onGoogle }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  useEffect(() => {
    preloadGoogle().catch(() => {});
  }, []);

  async function handleGoogleClick() {
    if (!acceptedTerms) {
      setError('Please accept the terms, and conditions by Bookfolio.live to continue.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onGoogle();
    } catch (problem) {
      setError(problem.message);
      setBusy(false);
    }
  }

  return (
    <FlowShell navRight={<a className="fg-nav-link" href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Sign up'}</a>}>
      <div className="fg-auth" aria-busy={busy}>
        <div className="fg-head">
          <h1>{isSignup ? 'Create your account' : 'Sign in'}</h1>
          <p>{isSignup ? 'Set up your virtual bookshelf in minutes' : 'Welcome back to your virtual bookshelf'}</p>
        </div>

        <button type="button" className="g" disabled={busy} onClick={handleGoogleClick}>
          <img src={asset(AUTH_BASE, '147c6.svg')} alt="" />
          <span>{busy ? 'Waiting for Google…' : 'Continue with Google'}</span>
        </button>

        <label className="fg-auth__terms">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={event => {
              setAcceptedTerms(event.target.checked);
              if (error) setError('');
            }}
          />
          <span>
            I accept the <a href="/terms" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>terms, and conditions</a> by Bookfolio.live
          </span>
        </label>

        {error && <p id="auth-error" role="alert" className="err">{error}</p>}
      </div>
    </FlowShell>
  );
}

