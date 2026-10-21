import Icon from './Icon.jsx';

// A short note in the corner after a change ("Message deleted."); problems show in red.
export default function Toast({ toast }) {
  return (
    <div className="ap-toasts" role="status" aria-live="polite">
      {toast && (
        <p key={toast.id} className="ap-toast" data-tone={toast.tone}>
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} />
          {toast.message}
        </p>
      )}
    </div>
  );
}
