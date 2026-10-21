import Icon from './Icon.jsx';

// What a list says when it has nothing in it yet.
export default function EmptyState({ icon, title, children }) {
  return (
    <div className="ad-empty">
      <span className="ad-empty__icon"><Icon name={icon} size={22} /></span>
      <p className="ad-empty__title">{title}</p>
      {children && <p className="ad-empty__text">{children}</p>}
    </div>
  );
}
