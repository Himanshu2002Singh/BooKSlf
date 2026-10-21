import usePageTitle from '../../app/usePageTitle.js';
import { count } from '../format.js';
import { ADMIN_PAGES } from '../routes.js';
import Icon from './Icon.jsx';
import Toast from './Toast.jsx';

// The frame around every admin page: the sidebar (a top bar on phones), the page title with
// "Refresh", any error, and the toast that confirms changes.
export default function AdminLayout({ page, admin, onRefresh, children }) {
  const { overview, error, refreshedAt, toast, signOut } = admin;
  usePageTitle(`${page.title} · Admin`);

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-side__brand">
          <a className="ad-brand" href="/">Bookshelf.cv</a>
          <span className="ad-brand__tag">Admin</span>
        </div>
        <nav className="ad-nav" aria-label="Admin pages">
          {ADMIN_PAGES.map(item => (
            <a key={item.path} href={item.path} aria-current={item.path === page.path ? 'page' : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.count && <span className="ad-nav__count">{count(item.count(overview.counts))}</span>}
            </a>
          ))}
        </nav>
        <div className="ad-side__foot">
          <a className="ad-side__action" href="/" target="_blank" rel="noreferrer" title="View site">
            <Icon name="external" /><span className="ad-side__label">View site</span>
          </a>
          <button type="button" className="ad-side__action" onClick={signOut} title="Sign out">
            <Icon name="logout" /><span className="ad-side__label">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-head">
          <div>
            <h1>{page.title}</h1>
            <p>{page.lede}</p>
          </div>
          <div className="ad-head__actions">
            {refreshedAt && <span className="ad-head__time">Updated {refreshedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>}
            <button type="button" className="ad-btn ad-btn--quiet" onClick={onRefresh}><Icon name="refresh" size={16} />Refresh</button>
          </div>
        </header>
        {error && <p className="ad-alert" role="alert"><Icon name="alert" />{error}</p>}
        {children}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
