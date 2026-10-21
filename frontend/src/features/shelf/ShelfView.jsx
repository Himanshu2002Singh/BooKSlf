import { useLayoutEffect, useRef, useState } from 'react';
import BookCover from '../../components/BookCover.jsx';
import '../../styles/shelf-views.css';

const SPINE_COLORS = [
  ['#2a9a9b', '#fff'], ['#e2336f', '#fff'], ['#f5b71b', '#2b2112'], ['#1f1f1f', '#fff'],
  ['#f2f0ec', '#2b2112'], ['#7c2d10', '#fff'], ['#8e2fb8', '#fff'], ['#1597d2', '#fff'], ['#25584a', '#fff'],
];
const SPINE_HEIGHTS = [224, 263, 176];
const SPINE_MAX = 300;
// Padding, the gilt bands and their gaps take this much of every spine.
const SPINE_CHROME = 64;

// Bold 14px Inter runs up to about 7.8px per character; spines grow to fit the title and
// wrap onto a second line only past SPINE_MAX.
function spineSize(title, seed) {
  const needed = Math.ceil(title.length * 7.8) + SPINE_CHROME;
  return {
    height: Math.max(SPINE_HEIGHTS[seed % SPINE_HEIGHTS.length], Math.min(needed, SPINE_MAX)),
    wrap: needed > SPINE_MAX,
  };
}

function hash(value = '') {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = ((result << 5) - result + value.charCodeAt(index)) | 0;
  return Math.abs(result);
}

function chunk(items, size) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
}

// How many books fit on one shelf at the shelf's current width, up to `max`, so every row of
// books gets its own plank instead of wrapping above it. Book and gap sizes change at container
// breakpoints in the CSS, so they are read from the first row rather than repeated here.
// `bookSelector` must name an element whose width never animates, or a resize mid-transition
// would count books at the wrong width.
function useShelfCapacity(max, rowSelector, bookSelector) {
  const ref = useRef(null);
  const [capacity, setCapacity] = useState(max);

  useLayoutEffect(() => {
    const shelves = ref.current;
    if (!shelves) return undefined;
    const update = () => {
      const row = shelves.querySelector(rowSelector);
      const book = row?.querySelector(bookSelector);
      if (!book) return;
      const rowStyle = getComputedStyle(row);
      const gap = parseFloat(rowStyle.columnGap) || 0;
      const width = row.clientWidth - parseFloat(rowStyle.paddingLeft) - parseFloat(rowStyle.paddingRight);
      const fits = Math.floor((width + gap) / (parseFloat(getComputedStyle(book).width) + gap));
      if (!Number.isNaN(fits)) setCapacity(Math.min(max, Math.max(1, fits)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(shelves);
    return () => observer.disconnect();
  }, [max, rowSelector, bookSelector]);

  return [ref, capacity];
}

function bookLabel(book) {
  return `Open ${book.title}${book.author ? ` by ${book.author}` : ''}`;
}

// Where the book sits on screen, so the reading view can lift it off the shelf.
// A spine counts as a cover once it has turned (hover or focus) to show its jacket.
function bookOrigin(button) {
  const cover = button.querySelector('.book-cover')?.getBoundingClientRect();
  if (cover && cover.width / cover.height > .45) return { rect: cover, spine: false };
  return {
    rect: button.getBoundingClientRect(),
    spine: button.classList.contains('sv-spine'),
    cloth: button.style.getPropertyValue('--cloth'),
    ink: button.style.color,
  };
}

function selectBook(onBookSelect, book) {
  return event => onBookSelect?.(book, bookOrigin(event.currentTarget));
}

function GridView({ books, onBookSelect }) {
  return (
    <div className="sv-grid">
      {books.map((book, index) => (
        <button key={book.id ?? index} type="button" className="sv-tile" style={{ '--i': index }} aria-label={bookLabel(book)} onClick={selectBook(onBookSelect, book)}>
          <BookCover book={book} className="sv-tile__cover" />
        </button>
      ))}
    </div>
  );
}

function DigitalShelfView({ books, onBookSelect }) {
  const [shelvesRef, perShelf] = useShelfCapacity(5, '.sv-plank-row__books', '.sv-dbook');
  return (
    <div ref={shelvesRef} className="sv-planks" style={{ '--per-shelf': perShelf }}>
      {chunk(books, perShelf).map((row, rowIndex) => (
        <div key={rowIndex} className="sv-plank-row">
          <div className="sv-plank-row__books">
            {row.map((book, index) => (
              <button key={book.id ?? index} type="button" className="sv-dbook" style={{ '--i': rowIndex * perShelf + index }} aria-label={bookLabel(book)} onClick={selectBook(onBookSelect, book)}>
                <BookCover book={book} className="sv-dbook__cover" />
              </button>
            ))}
          </div>
          <div className="sv-plank" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

function SpineView({ books, onBookSelect }) {
  // A spine animates wider while it opens, so measure its face, which keeps the resting width.
  const [shelvesRef, perShelf] = useShelfCapacity(12, '.sv-spine-row__books', '.sv-spine__face');
  return (
    <div ref={shelvesRef} className="sv-spines">
      {chunk(books, perShelf).map((row, rowIndex) => (
        <div key={rowIndex} className="sv-spine-row">
          <div className="sv-spine-row__books">
            {row.map((book, index) => {
              const position = rowIndex * perShelf + index;
              const seed = hash(String(book.id ?? book.title));
              const [background, color] = SPINE_COLORS[(position + seed) % SPINE_COLORS.length];
              const title = book.title ?? '';
              const { height, wrap } = spineSize(title, seed);
              return (
                <button
                  key={book.id ?? index}
                  type="button"
                  className="sv-spine"
                  data-wrap={wrap || undefined}
                  aria-label={bookLabel(book)}
                  title={[book.title, book.author].filter(Boolean).join(' — ')}
                  onClick={selectBook(onBookSelect, book)}
                  style={{ height, color, '--cloth': background, '--cover-w': `${Math.round(height * .68)}px`, '--i': position }}
                >
                  <span className="sv-spine__face" aria-hidden="true">
                    <i className="sv-spine__band" />
                    <span className="sv-spine__title">{title}</span>
                    <i className="sv-spine__band" />
                  </span>
                  <span className="sv-spine__jacket" aria-hidden="true">
                    <BookCover book={book} interactive={false} className="sv-spine__cover" />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="sv-plank sv-plank--thin" aria-hidden="true" />
        </div>
      ))}
      <div className="sv-lamp" aria-hidden="true"><i /><b /></div>
    </div>
  );
}

function MacView({ books, onBookSelect }) {
  return (
    <div className="sv-mac">
      {books.map((book, index) => (
        <button key={book.id ?? index} type="button" className="sv-mac__item" style={{ '--i': index }} aria-label={bookLabel(book)} onClick={selectBook(onBookSelect, book)}>
          <span className="sv-mac__book" style={{ '--book-edge': book.spineBg || book.color || '#555' }}>
            <BookCover book={book} interactive={false} showSpineShadow={false} className="sv-mac__cover" />
          </span>
          <span className="sv-mac__caption">{book.title}</span>
        </button>
      ))}
    </div>
  );
}

export default function ShelfView({ theme, books = [], onBookSelect, empty }) {
  const view = theme?.view ?? 'grid';
  const content = !books.length ? empty
    : view === 'shelf' ? <DigitalShelfView books={books} onBookSelect={onBookSelect} />
      : view === 'spine' ? <SpineView books={books} onBookSelect={onBookSelect} />
        : view === 'macos' ? <MacView books={books} onBookSelect={onBookSelect} />
          : <GridView books={books} onBookSelect={onBookSelect} />;

  return (
    <section className="sv" data-view={view} data-variant={theme?.variant ?? 'light'} aria-label={`${theme?.name ?? 'Bookshelf'} books`}>
      {content}
    </section>
  );
}

// Live, scaled-down render of a shelf look, used for theme cards and previews.
const PREVIEW_STAGE = { grid: 1280, shelf: 1280, spine: 1080, macos: 820 };

export function ThemePreview({ theme, books, stageWidth: requestedWidth, className = '', children }) {
  const stageWidth = requestedWidth ?? PREVIEW_STAGE[theme?.view] ?? 1280;
  const frameRef = useRef(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const update = () => setScale(frame.clientWidth / stageWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [stageWidth]);

  return (
    <div ref={frameRef} className={`sv-preview ${className}`} aria-hidden="true" inert>
      <div className="sv-preview__stage" style={{ width: stageWidth, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}>
        {children}
        <ShelfView theme={theme} books={books} />
      </div>
    </div>
  );
}
