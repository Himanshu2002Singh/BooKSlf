import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewSummary from '../components/ReviewSummary.jsx';
import Skeleton from '../components/Skeleton.jsx';

// /admin/reviews — the average and spread of ratings, then every review, newest first.
export default function ReviewsPage({ admin }) {
  const { request } = admin;
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    request('/reviews').then(data => live && setReviews(data.reviews), failure => live && setError(failure.message));
    return () => { live = false; };
  }, [request]);

  if (error) return <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>;
  if (!reviews) return <div className="ad-card"><Skeleton rows={4} height={72} /></div>;
  if (!reviews.length) {
    return (
      <div className="ad-card">
        <EmptyState icon="star" title="No reviews yet">Readers are asked for a review once they finish making their shelf.</EmptyState>
      </div>
    );
  }
  return (
    <div className="ad-reviews">
      <ReviewSummary reviews={reviews} />
      <ul className="ad-review-list">
        {reviews.map(review => <ReviewCard key={review.email} review={review} />)}
      </ul>
    </div>
  );
}
