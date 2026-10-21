// Soft placeholder bars while a page's data loads.
export default function Skeleton({ rows = 4, height = 56 }) {
  return (
    <div className="ad-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => <span key={index} style={{ height }} />)}
    </div>
  );
}
