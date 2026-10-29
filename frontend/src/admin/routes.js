import MessagesPage from './pages/MessagesPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import PricesPage from './pages/PricesPage.jsx';
import ReadersPage from './pages/ReadersPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';

export const LOGIN_PATH = '/admin/login';

// The admin pages, in sidebar order. `count` picks the number shown beside a link from the totals.
export const ADMIN_PAGES = [
  { path: '/admin', label: 'Overview', icon: 'grid', title: 'Overview', lede: 'How Bookfolio.live is doing, at a glance.', Page: OverviewPage },
  { path: '/admin/readers', label: 'Readers', icon: 'users', title: 'Readers', lede: 'Everyone with an account, newest first.', Page: ReadersPage, count: counts => counts.readers },
  { path: '/admin/prices', label: 'Looks & prices', icon: 'layers', title: 'Looks & prices', lede: 'Which looks shelves use, and what the premium ones cost.', Page: PricesPage },
  { path: '/admin/messages', label: 'Messages', icon: 'inbox', title: 'Messages', lede: 'Questions and theme sign-ups sent from the home page.', Page: MessagesPage, count: counts => counts.questions + counts.updates },
  { path: '/admin/reviews', label: 'Reviews', icon: 'star', title: 'Reviews', lede: 'What readers think of Bookfolio.live, and which reviews the home page shows.', Page: ReviewsPage, count: counts => counts.reviews },
];

export const adminPage = pathname => ADMIN_PAGES.find(page => page.path === pathname) ?? null;

export const isAdminPath = pathname => pathname === '/admin' || pathname.startsWith('/admin/');
