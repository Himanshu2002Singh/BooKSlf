import { useEffect, useState } from 'react';
import { themes } from '../../data/themes.js';
import { timeAgo } from '../../lib/time.js';
import Avatar from '../components/Avatar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Stars from '../components/Stars.jsx';
import { count, plural, rupees } from '../format.js';

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

// /admin — four totals, how the looks are used, and the newest messages and reviews.
export default function OverviewPage({ admin }) {
  const { overview: { counts, usage, prices }, request } = admin;
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    let live = true;
    Promise.all([request('/messages'), request('/reviews')])
      .then(([inbox, feedback]) => live && setLatest({ messages: inbox.messages.slice(0, 3), reviews: feedback.reviews.slice(0, 3) }))
      .catch(() => live && setLatest({ messages: [], reviews: [] }));
    return () => { live = false; };
  }, [request]);

  const totals = [
    { icon: 'users', label: 'Readers', value: count(counts.readers), note: `${count(counts.readersWithBooks)} with books on their shelf` },
    { icon: 'book', label: 'Books on shelves', value: count(counts.books), note: counts.readersWithBooks ? `About ${count(Math.round(counts.books / counts.readersWithBooks))} per shelf` : 'No books yet' },
    { icon: 'link', label: 'Goodreads connected', value: count(counts.goodreadsLinked), note: `${percent(counts.goodreadsLinked, counts.readers)}% of readers` },
    { icon: 'star', label: 'Average rating', value: counts.averageRating === null ? '—' : `${counts.averageRating.toFixed(1)} ★`, note: counts.reviews ? `From ${plural(counts.reviews, 'review')}` : 'No reviews yet' },
  ];
  const shelves = themes.reduce((sum, theme) => sum + (usage[theme.id]?.readers ?? 0), 0);

  return (
    <div className="ap-overview">
      <section className="ap-kpis" aria-label="Totals">
        {totals.map(total => (
          <article key={total.label} className="ap-kpi">
            <span className="ap-kpi__icon"><Icon name={total.icon} /></span>
            <h2 className="ap-kpi__label">{total.label}</h2>
            <p className="ap-kpi__value">{total.value}</p>
            <p className="ap-kpi__note">{total.note}</p>
          </article>
        ))}
      </section>

      <section className="ap-card ap-usage" aria-labelledby="usage-title">
        <header className="ap-card__head">
          <h2 id="usage-title">Looks in use</h2>
          <a href="/admin/prices">Edit prices</a>
        </header>
        <ul>
          {themes.map(theme => {
            const readers = usage[theme.id]?.readers ?? 0;
            const share = percent(readers, shelves);
            const price = prices[theme.id];
            return (
              <li key={theme.id}>
                <span className="ap-usage__name">{theme.name}<small>{price ? `${rupees.format(price.inr)} · $${price.usd} badge` : 'Free'}</small></span>
                <span className="ap-bar" aria-hidden="true"><i style={{ width: `${readers ? Math.max(share, 2) : 0}%` }} /></span>
                <span className="ap-usage__count">{plural(readers, 'shelf', 'shelves')}<small>{share}%</small></span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ap-card" aria-labelledby="inbox-title">
        <header className="ap-card__head">
          <h2 id="inbox-title">Newest messages</h2>
          <a href="/admin/messages">All messages</a>
        </header>
        {!latest ? <Skeleton rows={3} height={44} /> : latest.messages.length ? (
          <ul className="ap-mini">
            {latest.messages.map(message => (
              <li key={message.id}>
                <span className="ap-mini__icon" data-kind={message.kind}><Icon name={message.kind === 'question' ? 'help' : 'bell'} size={16} /></span>
                <div>
                  <p>{message.text}</p>
                  <small>{message.email ?? 'No email'} · {timeAgo(message.sentAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon="inbox" title="No messages yet">Questions and theme sign-ups from the home page land here.</EmptyState>}
      </section>

      <section className="ap-card" aria-labelledby="reviews-title">
        <header className="ap-card__head">
          <h2 id="reviews-title">Newest reviews</h2>
          <a href="/admin/reviews">All reviews</a>
        </header>
        {!latest ? <Skeleton rows={3} height={44} /> : latest.reviews.length ? (
          <ul className="ap-mini">
            {latest.reviews.map(review => (
              <li key={review.email}>
                <Avatar name={review.name} email={review.email} picture={review.picture} size={32} />
                <div>
                  <Stars value={review.rating} size={13} />
                  <p>{review.text || 'Rated without writing a review.'}</p>
                  <small>{review.name} · {timeAgo(review.updatedAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon="star" title="No reviews yet">Readers are asked for one when they finish their shelf.</EmptyState>}
      </section>
    </div>
  );
}
