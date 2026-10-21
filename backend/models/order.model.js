// The orders table: tracking Razorpay orders, themes bought, and payment status.
import { query } from '../db/pool.js';

export async function create({ id, userId, themeId, amount, currency = 'INR', status = 'created' }) {
  await query(
    'INSERT INTO orders (id, user_id, theme_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, themeId, amount, currency, status],
  );
  return findById(id);
}

export async function findById(id) {
  const rows = await query('SELECT * FROM orders WHERE id = ?', [id]);
  return rows[0] ?? null;
}

export async function markPaid(id, paymentId) {
  await query(
    "UPDATE orders SET status = 'paid', payment_id = ? WHERE id = ?",
    [paymentId, id],
  );
  return findById(id);
}

export async function markFailed(id) {
  await query(
    "UPDATE orders SET status = 'failed' WHERE id = ?",
    [id],
  );
  return findById(id);
}
