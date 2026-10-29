import { useState } from 'react';
import BookList from '../BookList.jsx';
import ImportStatus from '../ImportStatus.jsx';
import { timeAgo } from '../../../lib/time.js';

const books = count => `${count} ${count === 1 ? 'book' : 'books'}`;

// "Connect Goodreads": paste a profile link once and its Read and Currently Reading books come in.
// The profile stays connected: new books on it sync in when the app opens, or with "Sync now".
export default function GoodreadsPanel({ hidden, books: imported, link, onConnect, onSync, onEdit, onAddManually }) {
  const [profile, setProfile] = useState('');
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(''); // '' | 'connecting' | 'syncing'
  const [result, setResult] = useState({ tone: '', text: '' });

  async function run(kind, action, describe) {
    setBusy(kind);
    setResult({ tone: '', text: '' });
    try {
      setResult({ tone: 'success', text: describe(await action()) });
      setChanging(false);
    } catch (failure) {
      setResult({ tone: 'error', text: failure.message });
    } finally {
      setBusy('');
    }
  }

  function connect(event) {
    event.preventDefault();
    if (!profile.trim()) {
      setResult({ tone: 'error', text: 'Paste your Goodreads profile link or user ID first.' });
      return;
    }
    run('connecting', () => onConnect(profile.trim()), ({ found, added }) => (
      `Connection with Goodreads Verified! Found ${books(found)}${added.length < found ? `, ${added.length} of them new to your shelf` : ''}.`
    ));
  }

  const sync = () => run('syncing', onSync, ({ added }) => (
    added.length ? `${books(added.length)} added from Goodreads.` : 'You’re up to date. Nothing new on Goodreads since the last sync.'
  ));

  const showForm = (!link || changing) && busy !== 'connecting';
  return (
    <section className="fg-panel" aria-label="Connect Goodreads" hidden={hidden}>
      {showForm && (
        <form onSubmit={connect} noValidate>
          <h2>Sync with Goodreads</h2>
          <p className="fg-panel__desc">Enter your Goodreads username or profile ID. We will extract your ‘Currently Reading’ and ‘Read’ Shelves, and keep them in sync.</p>
          <label className="fg-panel__label" htmlFor="goodreads-id">Paste your Goodreads ID here</label>
          <div className="fg-sync">
            <input
              id="goodreads-id"
              className="fg-input"
              value={profile}
              onChange={event => setProfile(event.target.value)}
              placeholder="Goodreads profile link or ID"
              autoComplete="off"
              aria-describedby={result.tone === 'error' ? 'goodreads-result' : undefined}
            />
            <button type="submit" className="fg-cta">Fetch My Goodreads Shelf</button>
          </div>
          {changing && <button type="button" className="fg-link-button" onClick={() => setChanging(false)}>Keep my current profile</button>}
        </form>
      )}
      {link && !showForm && busy !== 'connecting' && (
        <div className="fg-gr">
          <h2>Synced with Goodreads</h2>
          <p className="fg-panel__desc">
            New books on your <a href={link.profileUrl} target="_blank" rel="noreferrer">Goodreads profile</a>’s Read and Currently Reading
            shelves come in on their own whenever you open Bookfolio.live. Last synced {timeAgo(link.syncedAt)}.
          </p>
          <div className="fg-gr__actions">
            <button type="button" className="fg-cta" onClick={sync} disabled={Boolean(busy)}>{busy === 'syncing' ? 'Syncing…' : 'Sync now'}</button>
            <button type="button" className="fg-outline" onClick={() => { setChanging(true); setResult({ tone: '', text: '' }); }} disabled={Boolean(busy)}>Use another profile</button>
          </div>
        </div>
      )}
      {busy === 'connecting' && <ImportStatus>Trying to connect with Goodreads, and syncing your books...</ImportStatus>}
      {busy === 'syncing' && <ImportStatus>Checking Goodreads for new books...</ImportStatus>}
      {!busy && result.tone === 'success' && <ImportStatus tone="success">{result.text}</ImportStatus>}
      {!busy && result.tone === 'error' && <p id="goodreads-result" className="fg-field-error" role="alert">{result.text}</p>}
      {imported.length > 0 && (
        <BookList title={`Imported books from Goodreads (${imported.length})`} books={imported} action="Edit Details" onAction={onEdit} onAddManually={onAddManually} />
      )}
    </section>
  );
}
