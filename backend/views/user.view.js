// JSON the browser may see about the signed-in reader. Raw rows (password hash,
// lockout state, session version) never leave the server.
import { profileUrl } from '../services/goodreads.service.js';
import { suggestUsername } from '../validators/username.validator.js';

export function userView(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
    username: row.username,
    since: new Date(row.created_at).getUTCFullYear(),
    hasPassword: Boolean(row.password_hash),
    hasGoogle: Boolean(row.google_sub),
    suggestedUsername: row.username ? null : suggestUsername(row.name || row.email),
  };
}

export function reviewView(review) {
  return review ? { rating: review.rating, text: review.body } : null;
}

// The Goodreads profile the shelf syncs from, and when it was last read.
export function goodreadsView(link) {
  return link ? { profileUrl: profileUrl(link.goodreadsId), syncedAt: new Date(link.syncedAt).toISOString() } : null;
}

// What sign-up, sign-in and GET /api/me answer: the reader, their shelf, their review of
// Bookshelf.cv and their Goodreads link (both null until they have one).
export function accountView(row, { shelf, review, goodreads }) {
  return { user: userView(row), shelf, review: reviewView(review), goodreads: goodreadsView(goodreads) };
}
