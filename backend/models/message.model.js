// The messages table: theme-news sign-ups and questions sent from the landing page.
import { query } from '../db/pool.js';

export async function create({ kind, body, email, userId }) {
  await query('INSERT INTO messages (kind, body, email, user_id) VALUES (?, ?, ?, ?)', [kind, body, email, userId]);
}

// For the admin panel, newest first.
export function list() {
  return query('SELECT id, kind, body, email, created_at FROM messages ORDER BY created_at DESC, id DESC LIMIT 500');
}

export async function remove(id) {
  await query('DELETE FROM messages WHERE id = ?', [String(id)]);
}
