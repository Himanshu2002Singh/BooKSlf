// The reviews table: each reader's star rating and words about Bookshelf.cv.
import { query } from '../db/pool.js';

export async function findByUser(userId) {
  return (await query('SELECT rating, body, updated_at FROM reviews WHERE user_id = ?', [userId]))[0] ?? null;
}

export async function save(userId, { rating, body }) {
  await query(
    'INSERT INTO reviews (user_id, rating, body) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), body = VALUES(body)',
    [userId, rating, body],
  );
  return findByUser(userId);
}

// For the admin panel: newest first, with who wrote each.
export function list() {
  return query(`SELECT r.rating, r.body, r.updated_at, u.name, u.email, u.username, u.picture
    FROM reviews r JOIN users u ON u.id = r.user_id ORDER BY r.updated_at DESC LIMIT 500`);
}
