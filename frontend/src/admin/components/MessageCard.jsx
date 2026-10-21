import { useState } from 'react';
import { timeAgo } from '../../lib/time.js';
import { moment } from '../format.js';
import Icon from './Icon.jsx';

const KINDS = {
  question: { label: 'Question', icon: 'help', tone: 'brand' },
  updates: { label: 'Theme updates', icon: 'bell', tone: 'green' },
};

// One message from the home page: a question to answer by email, or an email or handle that
// asked to hear about new looks. Deleting asks first, right in the card.
export default function MessageCard({ message, onCopy, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const kind = KINDS[message.kind];
  const copyText = message.kind === 'updates' ? message.text : message.email;
  const reply = message.kind === 'question' && message.email
    ? `mailto:${message.email}?subject=${encodeURIComponent('Your question to Bookshelf.cv')}&body=${encodeURIComponent(`\n\n> ${message.text}`)}`
    : null;

  async function remove() {
    setDeleting(true);
    if (!await onDelete(message)) setDeleting(false);
  }

  return (
    <li className="ad-card ad-message">
      <span className="ad-message__icon" data-kind={message.kind}><Icon name={kind.icon} /></span>
      <div className="ad-message__body">
        <div className="ad-message__meta">
          <span className="ad-chip" data-tone={kind.tone}>{kind.label}</span>
          <time dateTime={message.sentAt} title={moment(message.sentAt)}>{timeAgo(message.sentAt)}</time>
        </div>
        <p className="ad-message__text">{message.text}</p>
        <div className="ad-message__actions">
          {reply && <a className="ad-btn ad-btn--small ad-btn--primary" href={reply}><Icon name="reply" size={15} />Reply</a>}
          {message.email && <span className="ad-message__email">{message.email}</span>}
          {copyText && (
            <button type="button" className="ad-btn ad-btn--small ad-btn--quiet" onClick={() => onCopy(copyText)} aria-label={`Copy ${copyText}`}>
              <Icon name="copy" size={15} />Copy
            </button>
          )}
          <span className="ad-spacer" />
          {confirming ? (
            <span className="ad-confirm">
              Delete this message?
              <button type="button" className="ad-btn ad-btn--small ad-btn--danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
              <button type="button" className="ad-btn ad-btn--small ad-btn--quiet" onClick={() => setConfirming(false)} disabled={deleting}>Keep</button>
            </span>
          ) : (
            <button type="button" className="ad-btn ad-btn--small ad-btn--ghost" onClick={() => setConfirming(true)}><Icon name="trash" size={15} />Delete</button>
          )}
        </div>
      </div>
    </li>
  );
}
