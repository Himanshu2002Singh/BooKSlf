// The theme_prices table: what each premium look costs. The admin panel changes it.
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

export const DEFAULT_THEME_PRICES = {
  'gradient-grid': { inr: 89, usd: 1 },
  'dark-grid': { inr: 89, usd: 1 },
  'spine-shelf': { inr: 399, usd: 5 },
  'macos': { inr: 399, usd: 5 },
  'digital-shelf': { inr: 749, usd: 9 },
};

// { 'gradient-grid': { inr: 89, usd: 1 }, ... }
export async function all() {
  try {
    const rows = await query('SELECT theme_id, inr, usd FROM theme_prices');
    const fromDb = Object.fromEntries(rows.map(row => [row.theme_id, { inr: row.inr, usd: row.usd }]));
    return { ...DEFAULT_THEME_PRICES, ...fromDb };
  } catch {
    return { ...DEFAULT_THEME_PRICES };
  }
}

export async function find(themeId) {
  const id = String(themeId ?? '');
  try {
    const row = (await query('SELECT inr, usd FROM theme_prices WHERE theme_id = ?', [id]))[0];
    return row ?? DEFAULT_THEME_PRICES[id] ?? null;
  } catch {
    return DEFAULT_THEME_PRICES[id] ?? null;
  }
}

export async function update(themeId, { inr, usd }) {
  const id = String(themeId ?? '');
  if (!DEFAULT_THEME_PRICES[id]) throw new HttpError(404, 'Only premium looks have a price.');
  await query(
    'INSERT INTO theme_prices (theme_id, inr, usd) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE inr = VALUES(inr), usd = VALUES(usd)',
    [id, inr, usd],
  );
}
