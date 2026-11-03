import { useEffect, useState } from 'react';
import usePageTitle from '../app/usePageTitle.js';
import { getTheme, isThemeUnlocked, themes } from '../data/themes.js';
import ShelfLayout from '../features/shelf/ShelfLayout.jsx';
import { api } from '../lib/api.js';
import { shelfTitle } from '../lib/names.js';
import { trackSharedShelfViewed } from '../lib/analytics.js';
import NotFoundPage from './NotFoundPage.jsx';

// /<username> — a reader's published shelf, open to anyone with the link.
export default function PublicShelfPage({ app }) {
  const username = app.pathname.slice(1);
  const [result, setResult] = useState({ username: null });

  useEffect(() => {
    let live = true;
    api(`/shelves/${encodeURIComponent(username)}`)
      .then(data => live && setResult({ username, data }))
      .catch(error => live && setResult({ username, error }));
    return () => { live = false; };
  }, [username]);

  const loaded = result.username === username;
  const title = result.data ? shelfTitle(result.data.owner.name) : 'Bookshelf';
  usePageTitle(loaded && result.data ? title : null);

  useEffect(() => {
    if (!loaded || !result.data) return undefined;
    const startTime = Date.now();
    trackSharedShelfViewed({
      shelf_id: username,
      viewer_type: 'anonymous',
      referrer_type: document.referrer ? 'link' : 'direct',
    });
    return () => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (elapsed >= 3) {
        trackSharedShelfViewed({
          shelf_id: username,
          view_duration_seconds: elapsed,
          action: 'duration_flush',
        });
      }
    };
  }, [loaded, username, result.data]);

  if (!loaded) return null;
  if (result.error?.status === 404) return <NotFoundPage app={app} message="No bookshelf lives at this link yet." />;
  if (result.error) return <NotFoundPage app={app} title="Shelf unavailable" message={result.error.message} />;

  const { owner, shelf } = result.data;
  const theme = getTheme(shelf.themeId);
  return (
    <ShelfLayout
      isDemo
      books={shelf.books}
      theme={isThemeUnlocked(theme, shelf.purchasedThemeIds) ? theme : themes[0]}
      title={title}
      since={owner.since}
      onStart={app.startSetup}
    />
  );
}
