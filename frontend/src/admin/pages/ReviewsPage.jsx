import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewSummary from '../components/ReviewSummary.jsx';
import Skeleton from '../components/Skeleton.jsx';

// /admin/reviews — the average and spread of ratings, then every review, newest first, each of
// which can be shown on the home page.
export default function ReviewsPage({ admin }) {
  const { request, notify } = admin;
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    request('/reviews').then(data => live && setReviews(data.reviews), failure => live && setError(failure.message));
    return () => { live = false; };
  }, [request]);

  async function feature(review) {
    const featured = !review.featured;
    try {
      await request(`/reviews/${review.id}`, { method: 'PUT', body: { featured } });
      setReviews(current => current.map(item => (item.id === review.id ? { ...item, featured } : item)));
      notify(featured ? 'Now on the home page.' : 'Taken off the home page.');
    } catch (failure) {
      notify(failure.message, 'error');
    }
  }

  if (error) return <p className="ap-alert" role="alert"><Icon name="alert" />{error}</p>;
  if (!reviews) return <div className="ap-card"><Skeleton rows={4} height={72} /></div>;
  if (!reviews.length) {
    return (
      <div className="ap-card">
        <EmptyState icon="star" title="No reviews yet">Readers are asked for a review once they finish making their shelf.</EmptyState>
      </div>
    );
  }
  return (
    <div className="ap-reviews">
      <ReviewSummary reviews={reviews} />
      <ul className="ap-review-list">
        {reviews.map(review => <ReviewCard key={review.id} review={review} onFeature={feature} />)}
      </ul>
    </div>
  );
}
