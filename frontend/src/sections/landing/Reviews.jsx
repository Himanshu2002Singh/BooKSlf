import { useEffect, useState } from 'react';
import { getTheme, themes } from '../../data/themes.js';
import { api } from '../../lib/api.js';
import { art, readerRows } from './content.jsx';

// Fills the cards until the admin picks readers' reviews for the home page, or when they can't load.
const SAMPLE = { name: 'Aman Gupta', look: 'Simple Themes', text: 'Setup took 2 minutes. Literally timed it. Now I have a portfolio that actually represents my work professionally.' };

const sampleQuote = themeId => ({ ...SAMPLE, photo: art('reader-avatar.jpg'), href: `/demo?theme=${themeId}` });
const readerQuote = review => ({
  name: review.name,
  look: getTheme(review.themeId).name,
  text: review.text,
  photo: review.picture,
  href: review.username ? `/${review.username}` : null,
});

// Each row keeps its artwork and takes turns through the picked reviews, so even one or two fill
// both rows, and many add cards. With none, every card shows the sample.
function cardRows(reviews) {
  const perRow = Math.ceil(reviews.length / readerRows.length);
  let next = 0;
  return readerRows.map((pairs, rowIndex) => Array.from({ length: Math.max(pairs.length, perRow) }, (_, cardIndex) => ({
    pair: pairs[cardIndex % pairs.length],
    quote: reviews.length ? readerQuote(reviews[next++ % reviews.length]) : sampleQuote(themes[(rowIndex * 4 + cardIndex) % themes.length].id),
  })));
}

// The rows drift, so a card reached with Tab may be off screen; bring it into view once the row has stopped.
function showFocusedCard(event) {
  const link = event.currentTarget;
  if (link.matches(':focus-visible')) requestAnimationFrame(() => link.closest('.tc').scrollIntoView({ block: 'nearest', inline: 'center' }));
}

// The reader's photo, or their initials when they have none or it won't load.
function Photo({ src, name }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  return <span>{name.trim().split(/\s+/).slice(0, 2).map(word => word[0]?.toUpperCase()).join('')}</span>;
}

function Testimonial({ pair: [right, left], quote, hidden }) {
  return (
    <div className="tc" aria-hidden={hidden || undefined}>
      <div className="v" style={{ left: '50%', right: 0 }}><div><img src={art(right)} alt="" /></div></div>
      <p className="q">"{quote.text}"</p>
      <div className="v" style={{ left: 0, right: '50%' }}><div><img src={art(left)} alt="" /></div></div>
      <div className="pr2">
        <div>
          <div className="av2"><Photo src={quote.photo} name={quote.name} /></div>
          <div className="nm"><b>{quote.name}</b><span>{quote.look}</span></div>
        </div>
        {quote.href && <a className="lk" href={quote.href} tabIndex={hidden ? -1 : undefined} onFocus={showFocusedCard}><img src={art('4606f.svg')} alt="" />View Bookshelf</a>}
      </div>
    </div>
  );
}

// Two rows of reader quotes drifting sideways in opposite directions: the reviews picked in the
// admin panel (GET /api/reviews), or the sample until there are some.
export default function Reviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    api('/reviews', { signal: controller.signal }).then(data => setReviews(data.reviews), () => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="say">
      <h2 className="h2" style={{ width: '100%' }} data-reveal>What book readers are saying...</h2>
      <div className="rows">
        {cardRows(reviews).map((row, index) => (
          <div className={index ? 'r r2' : 'r'} key={index} data-reveal style={{ '--d': index }}>
            {/* Cards repeat once so the loop scrolls seamlessly; the copy is hidden from assistive tech. */}
            <div className="mq">
              {[false, true].flatMap(hidden => row.map((card, cardIndex) => (
                <Testimonial key={`${hidden}-${cardIndex}`} hidden={hidden} pair={card.pair} quote={card.quote} />
              )))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
