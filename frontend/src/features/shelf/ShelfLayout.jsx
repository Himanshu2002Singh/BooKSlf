import { useEffect, useRef, useState } from 'react';
import { getTheme } from '../../data/themes.js';
import BookDetailsModal from './BookDetailsModal.jsx';
import ShelfView from './ShelfView.jsx';
import { DecorPair, FlowNav } from '../../components/FlowShell.jsx';
import { trackShelfShared } from '../../lib/analytics.js';
import '../../styles/shelf-page.css';



// Shared shelf page: nav, hero with the share link, and the shelf itself.
// shareUrl is null until the owner claims a username; linkEditor replaces the link box.
export default function ShelfLayout({
  books = [], theme, title, since, isDemo, shareUrl = window.location.href.split('#')[0], linkEditor, onEditLink, notice, tools,
  onSignOut, onModify, onAddBook, onStart,
}) {
  const [status, setStatus] = useState('');
  const [selection, setSelection] = useState(null);
  const timer = useRef(0);
  const selected = getTheme(theme);
  const shelfUrl = shareUrl ?? '';
  const shownUrl = shelfUrl.replace(/^https?:\/\//, '');

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function flash(message) {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 2400);
  }

  async function copyLink(message = 'Link copied') {
    try {
      await navigator.clipboard.writeText(shelfUrl);
      flash(message);
      trackShelfShared({
        shelf_id: shownUrl || 'shelf',
        share_method: 'copy_link',
        audience_type: 'public',
        share_target_count: 1,
      });
    } catch {
      flash('Copy unavailable — select the link and copy it manually');
    }
  }

  return (
    <div className="sp-page">
      {isDemo ? (
        <FlowNav right={<button type="button" className="sp-btn sp-btn--solid" onClick={onStart}>Create your bookshelf</button>} />
      ) : (
        <FlowNav
          left={<button type="button" className="fg-nav-link fg-nav-link--brand" onClick={onSignOut}>Sign Out</button>}
          right={(
            <>
              <button type="button" className="sp-btn" onClick={onModify}>Modify Shelf</button>
              <button type="button" className="sp-btn sp-btn--solid" onClick={onAddBook}>Add book</button>
            </>
          )}
        />
      )}

      <header className="sp-hero">
        <div className="sp-hero__decor" aria-hidden="true">
          <DecorPair corner="left" className="sp-hero__pair sp-hero__pair--left" />
          <DecorPair corner="right" className="sp-hero__pair sp-hero__pair--right" />
        </div>
        <p className="sp-eyebrow">BOOKFOLIO.LIVE/</p>
        <h1 className="sp-title">{title}</h1>
        <p className="sp-meta">{books.length} {books.length === 1 ? 'book' : 'books'} · reading since {since}</p>
        {linkEditor ?? (
          <div className="sp-link">
            <i aria-hidden="true" />
            <span title={shelfUrl}>{shownUrl}</span>
            {onEditLink && <button type="button" className="sp-link__edit" onClick={onEditLink}>Change</button>}
            <button type="button" onClick={() => copyLink()}>Copy link</button>
          </div>
        )}
        {onEditLink && !linkEditor && (
          <p className="sp-claim__custom">
            If you need your own custom URL, <a href="mailto:amangupta.ux@gmail.com?subject=Custom%20URL%20Inquiry">connect with us</a>
          </p>
        )}
        {/* Shareable links removed from the top from all views */}
        <p className="sp-status" role="status" aria-live="polite">{status || notice}</p>
        {tools}
      </header>

      <main>
        <ShelfView
          theme={selected}
          books={books}
          /* onBookSelect={(book, origin) => setSelection({ book, origin })} */
          empty={(
            <div className="sp-empty">
              <p>Your shelf is empty.</p>
              <button type="button" className="sp-btn sp-btn--solid" onClick={onAddBook}>Add books</button>
            </div>
          )}
        />
      </main>
      {/* BookDetailsModal & opening animation disabled per request; books are non-clickable (hover effects only) */}
      {/* <BookDetailsModal book={selection?.book} origin={selection?.origin} onClose={() => setSelection(null)} /> */}
    </div>
  );
}
