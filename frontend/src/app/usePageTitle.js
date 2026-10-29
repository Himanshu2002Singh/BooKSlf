import { useEffect } from 'react';

const SITE = 'Bookfolio.live';

// Gives each page its own browser-tab title ("Choose your look · Bookfolio.live").
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} — Make your shelf your own`;
  }, [title]);
}
