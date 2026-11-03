import { useEffect, useState } from 'react';
import usePageTitle from '../app/usePageTitle.js';
import { themes } from '../data/themes.js';
import { timeAgo } from '../lib/time.js';
import ReviewDialog from '../features/reviews/ReviewDialog.jsx';
import ShelfLayout from '../features/shelf/ShelfLayout.jsx';
import UsernameClaim from '../features/shelf/UsernameClaim.jsx';
import { shelfTitle } from '../lib/names.js';
import { trackRetentionShelfActive } from '../lib/analytics.js';

const REVIEW_DELAY = 1200; // Let the new shelf show for a moment before asking.

// /shelf — the reader's own shelf. Its public address is /<username> once claimed.
export default function ShelfPage({ app }) {
  const { user, askForReview } = app;
  const [editingLink, setEditingLink] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const title = shelfTitle(user?.name);
  const publicUrl = user?.username ? `${window.location.origin}/${user.username}` : null;
  usePageTitle(title);

  // Right after "Continue Creating Shelf", ask once for a review.
  useEffect(() => {
    if (!askForReview) return undefined;
    const timer = window.setTimeout(() => setReviewOpen(true), REVIEW_DELAY);
    return () => window.clearTimeout(timer);
  }, [askForReview]);

  // Track retention when reader visits their active shelf
  useEffect(() => {
    if (user?.id) {
      const daysSinceSignup = user.since ? Math.max(0, Math.round((Date.now() - new Date(user.since).getTime()) / (1000 * 60 * 60 * 24))) : 0;
      trackRetentionShelfActive({
        days_since_signup: daysSinceSignup,
        active_shelf_count: 1,
        primary_action: 'view',
      });
    }
  }, [user?.id]);

  function closeReview() {
    setReviewOpen(false);
    if (askForReview) app.reviewAsked();
  }

  async function syncNow() {
    setSyncing(true);
    setSyncMessage('');
    try {
      const { added } = await app.syncGoodreads();
      if (!added.length) setSyncMessage('You’re up to date. Nothing new on Goodreads since the last sync.');
    } catch (error) {
      setSyncMessage(error.message);
    } finally {
      setSyncing(false);
    }
  }

  const linkEditor = (!publicUrl || editingLink) ? (
    <UsernameClaim
      initial={user?.username ?? user?.suggestedUsername ?? ''}
      current={user?.username ?? null}
      onCheck={app.checkUsername}
      onClaim={app.claimUsername}
      onDone={() => setEditingLink(false)}
      onCancel={publicUrl ? () => setEditingLink(false) : undefined}
    />
  ) : null;

  const tools = (
    <div className="sp-tools">
      {app.goodreads && (
        <span>
          Goodreads synced {timeAgo(app.goodreads.syncedAt)} · <button type="button" onClick={syncNow} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync now'}</button>
        </span>
      )}
      {!app.review && (
        <button type="button" onClick={() => setReviewOpen(true)}>★ Leave a review</button>
      )}
      <a href="https://docs.google.com/forms/d/e/1FAIpQLSe1eG6q1MAQKkfRvDTqkQaGRi38TCVGMxKRUdVNNO21cpc9bA/viewform?usp=dialog" target="_blank" rel="noreferrer">Submit Feedback</a>
    </div>
  );

  return (
    <>
      <ShelfLayout
        books={app.books}
        theme={app.isUnlocked(app.theme) ? app.theme : themes[0]}
        title={title}
        since={user?.since ?? new Date().getFullYear()}
        shareUrl={publicUrl}
        linkEditor={linkEditor}
        onEditLink={() => setEditingLink(true)}
        notice={app.saveError || syncMessage || app.goodreadsNotice}
        tools={tools}
        onSignOut={app.signOut}
        onModify={() => app.navigate('/themes')}
        onAddBook={() => app.navigate('/books')}
      />
      {reviewOpen && <ReviewDialog review={app.review} onSave={app.saveReview} onClose={closeReview} />}
    </>
  );
}
