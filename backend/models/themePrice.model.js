// The theme_prices table: what each premium look costs. The admin panel changes it.
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

// { 'digital-shelf': { inr: 749, usd: 9 }, ... }
export async function all() {
  const rows = await query('SELECT theme_id, inr, usd FROM theme_prices');
  return Object.fromEntries(rows.map(row => [row.theme_id, { inr: row.inr, usd: row.usd }]));
}

export async function find(themeId) {
  const row = (await query('SELECT inr, usd FROM theme_prices WHERE theme_id = ?', [String(themeId ?? '')]))[0];
  return row ?? null;
}

export async function update(themeId, { inr, usd }) {
  const result = await query('UPDATE theme_prices SET inr = ?, usd = ? WHERE theme_id = ?', [inr, usd, themeId]);
  if (!result.affectedRows) throw new HttpError(404, 'Only premium looks have a price.');
}
