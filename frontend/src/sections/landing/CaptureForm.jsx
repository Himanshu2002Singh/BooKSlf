import { useRef, useState } from 'react';
import { api } from '../../lib/api.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The roadmap form ("tell me about new themes", kind "updates") and the contact form
// (kind "question", with an email to answer to). Both send to POST /api/messages, and the
// admin panel lists what arrives. Problems show as the browser's own field messages.
export default function CaptureForm({ kind, placeholder, label, emptyMessage, askEmail = false, defaultEmail = '' }) {
  const [value, setValue] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [state, setState] = useState('idle'); // idle | sending | sent
  const input = useRef(null);
  const emailInput = useRef(null);

  function complain(field, message) {
    field.current.setCustomValidity(message);
    field.current.reportValidity();
  }

  async function submit(event) {
    event.preventDefault();
    // Blank or spaces only: show the browser's own field message instead of doing nothing.
    if (!value.trim()) return complain(input, emptyMessage);
    if (askEmail && !EMAIL.test(email.trim())) return complain(emailInput, 'Add your email so we can answer you.');
    const website = new FormData(event.currentTarget).get('website'); // Hidden from people; only bots fill it.
    setState('sending');
    try {
      await api('/messages', { method: 'POST', body: { kind, text: value.trim(), ...(askEmail ? { email: email.trim() } : {}), website } });
      setState('sent');
      setValue('');
    } catch (error) {
      setState('idle');
      complain(input, error.message);
    }
  }

  const clear = setter => event => {
    event.target.setCustomValidity('');
    setter(event.target.value);
    setState(current => (current === 'sent' ? 'idle' : current));
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <input ref={input} aria-label={label} placeholder={placeholder} value={value} onChange={clear(setValue)} maxLength={1000} />
      {askEmail && (
        <input ref={emailInput} className="email" type="email" aria-label="Your email" placeholder="Your email" autoComplete="email" value={email} onChange={clear(setEmail)} />
      )}
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" disabled={state === 'sending'}>{state === 'sent' ? 'Thanks!' : state === 'sending' ? 'Sending…' : 'Submit'}</button>
      <span className="sr-only" role="status">{state === 'sent' ? 'Sent. Thank you!' : ''}</span>
    </form>
  );
}
