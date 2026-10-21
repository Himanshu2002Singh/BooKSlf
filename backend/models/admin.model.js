// Reports across tables for the admin panel. SQL for a single table lives in that table's model.
import { query } from '../db/pool.js';

export async function counts() {
  const [row] = await query(`SELECT
      (SELECT COUNT(*) FROM users) AS readers,
      (SELECT COUNT(*) FROM shelves WHERE JSON_LENGTH(books) > 0) AS readers_with_books,
      (SELECT COALESCE(SUM(JSON_LENGTH(books)), 0) FROM shelves) AS books,
      (SELECT COUNT(*) FROM goodreads_links) AS goodreads_linked,
      (SELECT COUNT(*) FROM reviews) AS reviews,
      (SELECT AVG(rating) FROM reviews) AS average_rating,
      (SELECT COUNT(*) FROM messages WHERE kind = 'question') AS questions,
      (SELECT COUNT(*) FROM messages WHERE kind = 'updates') AS updates`);
  return row;
}

// Every shelf's chosen and bought looks, to count readers per look.
export function looks() {
  return query('SELECT theme_id, purchased_theme_ids FROM shelves');
}

// One page of readers, newest first, optionally matching a name, email or username.
export async function readers({ search, page, pageSize }) {
  const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  const where = search ? 'WHERE u.email LIKE ? OR u.name LIKE ? OR u.username LIKE ?' : '';
  const params = search ? [like, like, like] : [];
  const [rows, [{ total }]] = await Promise.all([
    query(`SELECT u.id, u.email, u.name, u.username, u.picture, u.created_at,
        u.password_hash IS NOT NULL AS has_password, u.google_sub IS NOT NULL AS has_google,
        s.theme_id, s.purchased_theme_ids, JSON_LENGTH(s.books) AS book_count, s.updated_at,
        g.goodreads_id, r.rating
      FROM users u
      LEFT JOIN shelves s ON s.user_id = u.id
      LEFT JOIN goodreads_links g ON g.user_id = u.id
      LEFT JOIN reviews r ON r.user_id = u.id
      ${where} ORDER BY u.created_at DESC, u.id LIMIT ${Number(pageSize)} OFFSET ${(page - 1) * pageSize}`, params),
    query(`SELECT COUNT(*) AS total FROM users u ${where}`, params),
  ]);
  return { rows, total: Number(total) };
}
