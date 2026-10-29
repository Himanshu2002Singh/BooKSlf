// The six shelf looks from the Figma "Choose your look" screen. Cards show the
// USD badge from the design; checkout charges the INR price plus GST. Both prices are
// set in the admin panel; the numbers here are the defaults until the app loads them.
export const GST_RATE = 0.18;

// Takes the prices from GET /api/themes/prices (app/useBookshelf.js re-renders the pages after).
export function applyThemePrices(prices = {}) {
  for (const theme of themes) {
    const price = theme.paid ? prices[theme.id] : null;
    if (Number.isInteger(price?.inr) && Number.isInteger(price?.usd)) Object.assign(theme, { inr: price.inr, usd: price.usd });
  }
}

export const themes = [
  { id: 'light-grid', name: 'Light Grid', view: 'grid', variant: 'light', paid: false },
  { id: 'gradient-grid', name: 'Gradient Grid', view: 'grid', variant: 'gradient', paid: true, usd: 1, inr: 89 },
  { id: 'dark-grid', name: 'Dark Grid', view: 'grid', variant: 'dark', paid: true, usd: 1, inr: 89 },
  { id: 'spine-shelf', name: 'Spine Shelf', view: 'spine', variant: 'board', paid: true, usd: 5, inr: 399 },
  { id: 'macos', name: 'MacOS', view: 'macos', variant: 'light', paid: true, usd: 5, inr: 399 },
  { id: 'digital-shelf', name: 'Digital Shelf', view: 'shelf', variant: 'gradient', paid: true, usd: 9, inr: 749 },
];

export function getTheme(theme) {
  const id = typeof theme === 'string' ? theme : theme?.id;
  return themes.find(item => item.id === id) || themes[0];
}

export function isThemeUnlocked(theme, purchasedThemeIds = []) {
  const chosen = getTheme(theme);
  return !chosen.paid || purchasedThemeIds.includes(chosen.id);
}

// A price in rupees plus 18% GST, to the paisa.
export function totalWithGst(subtotal) {
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  return Math.round((subtotal + gst) * 100) / 100;
}

export function themePrice(theme) {
  const chosen = getTheme(theme);
  const subtotal = chosen.inr || 0;
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  return { subtotal, gst, total: totalWithGst(subtotal) };
}
