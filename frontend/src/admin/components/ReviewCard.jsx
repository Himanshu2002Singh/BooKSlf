import { useState } from 'react';
import { timeAgo } from '../../lib/time.js';
import { moment } from '../format.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Stars from './Stars.jsx';

// One reader's review: who wrote it and when, their stars, their words, a link to their shelf, and
// whether the home page shows it. Only a review with words can go on the home page.
export default function ReviewCard({ review, onFeature }) {
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    await onFeature(review);
    setSaving(false);
  }

  return (
    <li className="ap-card ap-review">
      <header>
        <Avatar name={review.name} email={review.email} picture={review.picture} />
        <div>
          <b>{review.name}</b>
          <span>{review.email}</span>
        </div>
        <time dateTime={review.updatedAt} title={moment(review.updatedAt)}>{timeAgo(review.updatedAt)}</time>
      </header>
      <Stars value={review.rating} size={16} />
      {review.text ? <blockquote>{review.text}</blockquote> : <p className="ap-review__none">Rated without writing a review.</p>}
      <div className="ap-review__actions">
        {review.username && (
          <a className="ap-link" href={`/${review.username}`} target="_blank" rel="noreferrer">View their shelf<Icon name="external" size={13} /></a>
        )}
        <span className="ap-spacer" />
        {review.featured && <span className="ap-chip" data-tone="green">On the home page</span>}
        {review.text && (
          <button type="button" className={`ap-btn ap-btn--small ${review.featured ? 'ap-btn--quiet' : 'ap-btn--primary'}`} onClick={toggle} disabled={saving}>
            <Icon name={review.featured ? 'eyeOff' : 'eye'} size={15} />
            {review.featured ? 'Take off home page' : 'Show on home page'}
          </button>
        )}
      </div>
    </li>
  );
}
