import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import MessageCard from '../components/MessageCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { count } from '../format.js';

const FILTERS = [['all', 'All'], ['question', 'Questions'], ['usecase', 'Usecase ideas'], ['updates', 'Theme updates']];

// /admin/messages — what visitors sent from the home page, newest first.
export default function MessagesPage({ admin }) {
  const { request, notify, refresh } = admin;
  const [messages, setMessages] = useState(null);
  const [kind, setKind] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    request('/messages').then(data => live && setMessages(data.messages), failure => live && setError(failure.message));
    return () => { live = false; };
  }, [request]);

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      notify(`Copied ${text}`);
    } catch {
      notify('Copying didn’t work here. Select the text and copy it instead.', 'error');
    }
  }

  // Answers whether the message is gone, so its card can stop waiting.
  async function remove(message) {
    try {
      await request(`/messages/${message.id}`, { method: 'DELETE', body: {} });
      setMessages(current => current.filter(item => item.id !== message.id));
      notify('Message deleted.');
      refresh();
      return true;
    } catch (failure) {
      notify(failure.message, 'error');
      return false;
    }
  }

  const all = messages ?? [];
  const totals = {
    all: all.length,
    question: all.filter(message => message.kind === 'question').length,
    usecase: all.filter(message => message.kind === 'usecase').length,
    updates: all.filter(message => message.kind === 'updates').length,
  };
  const shown = all.filter(message => kind === 'all' || message.kind === kind);

  return (
    <div className="ap-stack">
      <div className="ap-segmented" role="group" aria-label="Show">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}>
            {label}<span className="ap-segmented__count">{count(totals[id])}</span>
          </button>
        ))}
      </div>
      {error && <p className="ap-alert" role="alert"><Icon name="alert" />{error}</p>}
      {!messages ? <div className="ap-card"><Skeleton rows={3} height={64} /></div> : shown.length ? (
        <ul className="ap-messages">
          {shown.map(message => <MessageCard key={message.id} message={message} onCopy={copy} onDelete={remove} />)}
        </ul>
      ) : (
        <div className="ap-card">
          <EmptyState icon="inbox" title={kind === 'all' ? 'No messages yet' : 'Nothing here yet'}>
            The home page’s question box and “new themes” box send their messages here.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
