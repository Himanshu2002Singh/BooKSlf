import { titleParts } from '../../lib/names.js';

// One book in an import list: cover (or a coloured stand-in), title, author and one action.
// Search results also show the subtitle, which tells apart books that share a main title.
export default function BookCard({ book, action, onAction, selected, showSubtitle = false }) {
  const { main: title, subtitle } = titleParts(book.title);
  return (
    <div className="fg-book" data-selected={selected || undefined}>
      <div className="fg-book__cover">
        {book.cover && /^(https?:\/\/|\/)/.test(book.cover)
          ? <img src={book.cover} alt="" loading="lazy" />
          : <span style={{ background: book.color || '#7d3c1c' }}>{title}</span>}
      </div>
      <div className="fg-book__text">
        <span className="fg-book__title">{title}</span>
        {showSubtitle && subtitle && <span className="fg-book__subtitle">{subtitle}</span>}
        <span className="fg-book__author">{book.author}</span>
        <button type="button" className="fg-book__action" onClick={onAction} aria-label={`${action}: ${title}`}>{action}</button>
      </div>
    </div>
  );
}
