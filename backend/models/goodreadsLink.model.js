// The goodreads_links table: the Goodreads profile each reader imported, so it can sync again.
import { query } from '../db/pool.js';

export async function get(userId) {
  const row = (await query('SELECT * FROM goodreads_links WHERE user_id = ?', [userId]))[0];
  return row ? { goodreadsId: row.goodreads_id, seenIds: row.seen_book_ids, syncedAt: row.synced_at } : null;
}

// Links (or re-links) the profile and records a read of it just now.
export async function save(userId, { goodreadsId, seenIds }) {
  await query(
    `INSERT INTO goodreads_links (user_id, goodreads_id, seen_book_ids, synced_at) VALUES (?, ?, ?, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE goodreads_id = VALUES(goodreads_id), seen_book_ids = VALUES(seen_book_ids), synced_at = VALUES(synced_at)`,
    [userId, goodreadsId, JSON.stringify([...new Set(seenIds)])],
  );
  return get(userId);
}
