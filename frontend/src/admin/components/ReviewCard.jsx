import { timeAgo } from '../../lib/time.js';
import { moment } from '../format.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Stars from './Stars.jsx';

// One reader's review: who wrote it and when, their stars, their words and a link to their shelf.
export default function ReviewCard({ review }) {
  return (
    <li className="ad-card ad-review">
      <header>
        <Avatar name={review.name} email={review.email} picture={review.picture} />
        <div>
          <b>{review.name}</b>
          <span>{review.email}</span>
        </div>
        <time dateTime={review.updatedAt} title={moment(review.updatedAt)}>{timeAgo(review.updatedAt)}</time>
      </header>
      <Stars value={review.rating} size={16} />
      {review.text ? <blockquote>{review.text}</blockquote> : <p className="ad-review__none">Rated without writing a review.</p>}
      {review.username && (
        <a className="ad-link" href={`/${review.username}`} target="_blank" rel="noreferrer">View their shelf<Icon name="external" size={13} /></a>
      )}
    </li>
  );
}
