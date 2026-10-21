import Icon from './Icon.jsx';

// What a list says when it has nothing in it yet.
export default function EmptyState({ icon, title, children }) {
  return (
    <div className="ap-empty">
      <span className="ap-empty__icon"><Icon name={icon} size={22} /></span>
      <p className="ap-empty__title">{title}</p>
      {children && <p className="ap-empty__text">{children}</p>}
    </div>
  );
}
