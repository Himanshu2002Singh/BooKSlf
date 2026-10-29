import { useState } from 'react';
import { timeAgo } from '../../lib/time.js';
import { moment } from '../format.js';
import Icon from './Icon.jsx';

const KINDS = {
  question: { label: 'Question', icon: 'help', tone: 'brand' },
  updates: { label: 'Theme updates', icon: 'bell', tone: 'green' },
  usecase: { label: 'Usecase idea', icon: 'help', tone: 'brand' },
};

// One message from the home page: a question to answer by email, or an email or handle that
// asked to hear about new looks. Deleting asks first, right in the card.
export default function MessageCard({ message, onCopy, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const kind = KINDS[message.kind] ?? KINDS.question;
  const copyText = message.kind === 'updates' ? message.text : message.email;
  const reply = (message.kind === 'question' || message.kind === 'usecase') && message.email
    ? `mailto:${message.email}?subject=${encodeURIComponent(message.kind === 'usecase' ? 'Your shelf idea for Bookfolio.live' : 'Your question to Bookfolio.live')}&body=${encodeURIComponent(`\n\n> ${message.text}`)}`
    : null;

  async function remove() {
    setDeleting(true);
    if (!await onDelete(message)) setDeleting(false);
  }

  return (
    <li className="ap-card ap-message">
      <span className="ap-message__icon" data-kind={message.kind}><Icon name={kind.icon} /></span>
      <div className="ap-message__body">
        <div className="ap-message__meta">
          <span className="ap-chip" data-tone={kind.tone}>{kind.label}</span>
          <time dateTime={message.sentAt} title={moment(message.sentAt)}>{timeAgo(message.sentAt)}</time>
        </div>
        <p className="ap-message__text">{message.text}</p>
        <div className="ap-message__actions">
          {reply && <a className="ap-btn ap-btn--small ap-btn--primary" href={reply}><Icon name="reply" size={15} />Reply</a>}
          {message.email && <span className="ap-message__email">{message.email}</span>}
          {copyText && (
            <button type="button" className="ap-btn ap-btn--small ap-btn--quiet" onClick={() => onCopy(copyText)} aria-label={`Copy ${copyText}`}>
              <Icon name="copy" size={15} />Copy
            </button>
          )}
          <span className="ap-spacer" />
          {confirming ? (
            <span className="ap-confirm">
              Delete this message?
              <button type="button" className="ap-btn ap-btn--small ap-btn--danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
              <button type="button" className="ap-btn ap-btn--small ap-btn--quiet" onClick={() => setConfirming(false)} disabled={deleting}>Keep</button>
            </span>
          ) : (
            <button type="button" className="ap-btn ap-btn--small ap-btn--ghost" onClick={() => setConfirming(true)}><Icon name="trash" size={15} />Delete</button>
          )}
        </div>
      </div>
    </li>
  );
}
