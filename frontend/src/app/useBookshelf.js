import { useEffect, useRef, useState } from 'react';
import { applyThemePrices, getTheme, isThemeUnlocked } from '../data/themes.js';
import { api } from '../lib/api.js';
import { clearDraft, markReviewAsked, readDraft, saveDraft, wasReviewAsked } from '../lib/browserStorage.js';
import { requestGoogleAccessToken } from '../features/auth/google.js';
import { mergeBooks } from '../features/books/bookKey.js';
import { identifyUser, trackOnboardingCompleted, trackOnboardingFailed, trackSignupStarted } from '../lib/analytics.js';
import useBrowserRouter from './useBrowserRouter.js';
import useRouteScroll from './useRouteScroll.js';

const SIGNED_IN_ONLY = ['/themes', '/books', '/purchase', '/shelf'];
const EMPTY_SHELF = { books: [], themeId: 'light-grid', purchasedThemeIds: [] };
const SAVE_DELAY = 600;
const AUTO_SYNC_GAP = 10 * 60_000; // The server reads Goodreads at most this often anyway.
const NOTICE_TIME = 8000;

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

const booksWord = count => `${count} new ${count === 1 ? 'book' : 'books'}`;

// Everything the pages share: where we are, the signed-in reader (from the backend),
// the shelf being built (books, look, purchased looks), their review and Goodreads link,
// and the steps between pages. The shelf saves to the server a moment after each change
// and is cached in the browser.
export default function useBookshelf() {
  const router = useBrowserRouter();
  const { navigate } = router;
  const pathname = normalizePath(router.pathname);
  const [user, setUser] = useState(undefined); // undefined while we ask the server who is signed in
  const [draft, setDraft] = useState(readDraft);
  const [saveError, setSaveError] = useState('');
  const [review, setReview] = useState(null);
  const [goodreads, setGoodreads] = useState(null); // { profileUrl, syncedAt } once a profile is connected
  const [goodreadsNotice, setGoodreadsNotice] = useState('');
  const [askForReview, setAskForReview] = useState(false);
  const [, setPricesLoaded] = useState(false); // Re-renders the pages once admin prices replace the defaults.
  const savedShelf = useRef(null); // JSON of the last shelf the server confirmed
  const { books, themeId, purchasedThemeIds } = draft;
  const theme = getTheme(themeId);
  const ready = user !== undefined;

  function acceptSession({ user: nextUser, shelf, review: nextReview = null, goodreads: nextLink = null }) {
    setUser(nextUser ?? null);
    if (nextUser) identifyUser(nextUser);
    setReview(nextUser ? nextReview : null);
    setGoodreads(nextUser ? nextLink : null);
    setGoodreadsNotice('');
    setAskForReview(false);
    const nextShelf = nextUser ? shelf ?? EMPTY_SHELF : EMPTY_SHELF;
    savedShelf.current = JSON.stringify(nextShelf);
    setDraft(nextShelf);
    if (nextUser) saveDraft(nextShelf);
    else clearDraft();
    return nextShelf;
  }

  useEffect(() => {
    let live = true;
    api('/me')
      .then(data => live && acceptSession(data))
      .catch(() => live && setUser(null));
    // Look prices set in the admin panel. The defaults in data/themes.js show until they arrive.
    api('/themes/prices')
      .then(data => { if (live) { applyThemePrices(data.prices); setPricesLoaded(true); } })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  // Save shelf changes to the server shortly after they happen; flush on tab close.
  useEffect(() => {
    if (!user) return undefined;
    saveDraft(draft);
    const body = JSON.stringify(draft);
    if (body === savedShelf.current) return undefined;
    const save = () => api('/me/shelf', { method: 'PUT', body: draft })
      .then(({ shelf }) => { savedShelf.current = JSON.stringify(shelf); setSaveError(''); })
      .catch(error => setSaveError(`Your latest changes aren’t saved yet: ${error.message}`));
    const timer = window.setTimeout(save, SAVE_DELAY);
    const flush = () => fetch('/api/me/shelf', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body });
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', flush);
    };
  }, [draft, user]);

  // The server has already put Goodreads books on the saved shelf; add them to this copy too.
  function takeGoodreads({ added, goodreads: link }) {
    setGoodreads(link);
    if (added.length) setDraft(current => ({ ...current, books: mergeBooks(current.books, added) }));
  }

  async function syncGoodreads({ force = false } = {}) {
    const result = await api('/goodreads/sync', { method: 'POST', body: { force } });
    takeGoodreads(result);
    if (result.added.length) setGoodreadsNotice(`${booksWord(result.added.length)} from Goodreads added to your shelf.`);
    return result;
  }

  // New books on the reader's Goodreads profile come in on their own: when the app opens and
  // whenever the tab comes back into view.
  const linked = Boolean(user && goodreads);
  useEffect(() => {
    if (!linked) return undefined;
    let last = 0;
    function autoSync() {
      if (document.visibilityState !== 'visible' || Date.now() - last < AUTO_SYNC_GAP) return;
      last = Date.now();
      syncGoodreads().catch(() => {}); // Goodreads may be busy; the next sync tries again.
    }
    autoSync();
    document.addEventListener('visibilitychange', autoSync);
    return () => document.removeEventListener('visibilitychange', autoSync);
  }, [linked]);

  useEffect(() => {
    if (!goodreadsNotice) return undefined;
    const timer = window.setTimeout(() => setGoodreadsNotice(''), NOTICE_TIME);
    return () => window.clearTimeout(timer);
  }, [goodreadsNotice]);

  useRouteScroll(ready ? pathname : null);

  // The setup steps and the owner's shelf need a signed-in reader.
  const needsSignIn = ready && !user && SIGNED_IN_ONLY.includes(pathname);
  useEffect(() => {
    if (needsSignIn) navigate('/signup', { replace: true });
  }, [needsSignIn, navigate]);

  // If the user already has a bookshelf and they are signed in, directly land them on their shelf.
  const alreadySignedIn = ready && Boolean(user) && (pathname === '/login' || pathname === '/signup');
  useEffect(() => {
    if (alreadySignedIn) {
      navigate(books.length ? '/shelf' : '/themes', { replace: true });
    }
  }, [alreadySignedIn, books.length, navigate]);

  function updateDraft(changes) {
    setDraft(current => ({ ...current, ...changes }));
  }

  // After any sign-in: straight to the shelf if it has books, else start setup.
  function signedIn(data) {
    const shelf = acceptSession(data);
    navigate(shelf.books.length ? '/shelf' : '/themes');
  }

  return {
    ready,
    // Signed-out visitors see the sign-up page right away while the URL catches up.
    // Signed-in users see their shelf/themes right away if on /login or /signup.
    pathname: needsSignIn ? '/signup' : (alreadySignedIn ? (books.length ? '/shelf' : '/themes') : pathname),
    navigate,
    user,
    books,
    theme,
    purchasedThemeIds,
    saveError,
    review,
    askForReview,
    goodreads,
    goodreadsNotice,

    searchParam: name => new URLSearchParams(window.location.search).get(name),
    isUnlocked: chosen => isThemeUnlocked(chosen, purchasedThemeIds),
    // The new books, or (like React's setState) a function from the current books to them.
    setBooks: next => setDraft(current => ({ ...current, books: typeof next === 'function' ? next(current.books) : next })),
    selectTheme: chosen => updateDraft({ themeId: chosen.id }),

    startSetup() {
      trackSignupStarted({ entry_point: 'cta' });
      navigate(user ? (books.length ? '/shelf' : '/themes') : '/signup');
    },

    async signUp({ email, password }) {
      try {
        const data = await api('/auth/signup', { method: 'POST', body: { email, password } });
        signedIn(data);
        if (data.user) identifyUser(data.user);
      } catch (err) {
        trackOnboardingFailed({ failure_reason: err.message, failed_step: 'signup' });
        throw err;
      }
    },

    async logIn({ email, password }) {
      signedIn(await api('/auth/login', { method: 'POST', body: { email, password } }));
    },

    async continueWithGoogle() {
      const accessToken = await requestGoogleAccessToken();
      signedIn(await api('/auth/google', { method: 'POST', body: { accessToken } }));
    },

    requestPasswordReset: email => api('/auth/forgot', { method: 'POST', body: { email } }),

    async resetPassword(token, password) {
      signedIn(await api('/auth/reset', { method: 'POST', body: { token, password } }));
    },

    async signOut() {
      await api('/auth/logout', { method: 'POST', body: {} }).catch(() => {});
      acceptSession({ user: null });
      navigate('/');
    },

    checkUsername: name => api(`/usernames/${encodeURIComponent(name)}`),

    async claimUsername(name) {
      const data = await api('/me/username', { method: 'PUT', body: { username: name } });
      setUser(data.user);
      return data.user;
    },

    // Reads the profile's Read and Currently Reading shelves and keeps it connected for syncing.
    async connectGoodreads(profile) {
      const result = await api('/goodreads', { method: 'PUT', body: { profile } });
      takeGoodreads(result);
      return result;
    },

    // "Sync now": reads Goodreads even if it was read a moment ago.
    syncGoodreads: () => syncGoodreads({ force: true }),

    // "Continue Creating Shelf": show the shelf, and ask for a review if the reader hasn't left one.
    finishBooks() {
      trackOnboardingCompleted({
        bookshelf_count_imported: books.length,
        plan_tier: purchasedThemeIds?.length > 1 ? 'paid' : 'free',
      });
      if (user && !review && !wasReviewAsked(user.id)) setAskForReview(true);
      navigate('/shelf');
    },

    // The review prompt after making the shelf comes once per reader on this browser.
    reviewAsked() {
      setAskForReview(false);
      if (user) markReviewAsked(user.id);
    },

    async saveReview({ rating, text }) {
      const data = await api('/me/review', { method: 'PUT', body: { rating, text } });
      setReview(data.review);
    },

    // Free or already-bought looks go straight to adding books; others go to checkout first.
    continueFromThemes() {
      navigate(isThemeUnlocked(theme, purchasedThemeIds) ? '/books' : `/purchase?theme=${theme.id}`);
    },

    completePurchase(paidThemeId) {
      updateDraft({ themeId: paidThemeId, purchasedThemeIds: [...new Set([...purchasedThemeIds, paidThemeId])] });
      navigate('/themes');
    },
  };
}
