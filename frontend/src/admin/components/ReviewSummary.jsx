import { plural } from '../format.js';
import Stars from './Stars.jsx';

// The average rating, and how many readers gave each number of stars.
export default function ReviewSummary({ reviews }) {
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return (
    <section className="ad-card ad-summary" aria-label="Ratings">
      <p className="ad-summary__score">{average.toFixed(1)}</p>
      <Stars value={Math.round(average)} size={18} />
      <p className="ad-summary__count">from {plural(reviews.length, 'review')}</p>
      <ul className="ad-spread">
        {[5, 4, 3, 2, 1].map(stars => {
          const given = reviews.filter(review => review.rating === stars).length;
          return (
            <li key={stars}>
              <span aria-hidden="true">{stars} ★</span>
              <span className="ad-bar" aria-hidden="true"><i style={{ width: `${(given / reviews.length) * 100}%` }} /></span>
              <span aria-hidden="true">{given}</span>
              <span className="sr-only">{plural(given, 'reader')} gave {plural(stars, 'star')}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
