// The reviews table: each reader's star rating and words about Bookfolio.live, and featured_reviews:
// the ones the admin shows on the home page.
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

export async function findByUser(userId) {
  return (await query('SELECT rating, body, updated_at FROM reviews WHERE user_id = ?', [userId]))[0] ?? null;
}

export async function save(userId, { rating, body }) {
  // The admin picked the words as they were, so changed ones wait to be picked again.
  await query(
    'DELETE f FROM featured_reviews f JOIN reviews r ON r.user_id = f.user_id WHERE f.user_id = ? AND (r.rating <> ? OR r.body <> ?)',
    [userId, rating, body],
  );
  await query(
    'INSERT INTO reviews (user_id, rating, body) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), body = VALUES(body)',
    [userId, rating, body],
  );
  return findByUser(userId);
}

// For the admin panel: newest first, with who wrote each and whether it is on the home page.
export function list() {
  return query(`SELECT r.user_id, r.rating, r.body, r.updated_at, u.name, u.email, u.username, u.picture, f.user_id IS NOT NULL AS featured
    FROM reviews r JOIN users u ON u.id = r.user_id LEFT JOIN featured_reviews f ON f.user_id = r.user_id
    ORDER BY r.updated_at DESC LIMIT 500`);
}

// For the home page: the picked reviews, newest pick first, with who wrote each and their shelf's look.
export function featured() {
  return query(`SELECT r.body, u.name, u.picture, u.username, s.theme_id, s.purchased_theme_ids
    FROM featured_reviews f JOIN reviews r ON r.user_id = f.user_id JOIN users u ON u.id = f.user_id
    LEFT JOIN shelves s ON s.user_id = f.user_id
    WHERE r.body <> '' ORDER BY f.featured_at DESC LIMIT 20`);
}

// Shows a review on the home page or takes it off. Only a review with words can go on.
export async function setFeatured(userId, featured) {
  if (!featured) {
    await query('DELETE FROM featured_reviews WHERE user_id = ?', [userId]);
    return;
  }
  const review = await findByUser(userId);
  if (!review) throw new HttpError(404, 'That review is gone.');
  if (!review.body) throw new HttpError(400, 'This reader only gave stars, so there are no words to show.');
  await query('INSERT IGNORE INTO featured_reviews (user_id) VALUES (?)', [userId]);
}
