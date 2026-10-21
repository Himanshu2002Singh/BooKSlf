const STAR = 'm12 2.5 2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z';

// A 1–5 star rating, read out as "4 out of 5 stars".
export default function Stars({ value, size = 14 }) {
  return (
    <span className="ad-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} viewBox="0 0 24 24" width={size} height={size} data-on={star <= value} aria-hidden="true"><path d={STAR} /></svg>
      ))}
    </span>
  );
}
