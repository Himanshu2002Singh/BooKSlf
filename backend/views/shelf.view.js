// What bookshelf.cv/<username> shows: the owner's public profile (never their email) and shelf.
export function publicShelfView(owner, { books, themeId, purchasedThemeIds }) {
  return {
    owner: { name: owner.name, username: owner.username, picture: owner.picture, since: new Date(owner.created_at).getUTCFullYear() },
    shelf: { books, themeId, purchasedThemeIds },
  };
}

const FREE_LOOK = 'light-grid';

// The look a shelf actually shows: a premium look needs buying first (the app falls back the same way).
export function shownLook(themeId, purchased, prices) {
  const bought = Array.isArray(purchased) && purchased.includes(themeId);
  return prices[themeId] && !bought ? FREE_LOOK : themeId || FREE_LOOK;
}
