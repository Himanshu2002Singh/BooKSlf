// JSON shapes for the admin panel. Password hashes and session data never leave the server.
import { profileUrl } from '../services/goodreads.service.js';
import { shownLook } from './shelf.view.js';

const iso = value => (value ? new Date(value).toISOString() : null);
const list = value => (Array.isArray(value) ? value : []);

export function overviewView(counts, looks, prices) {
  const usage = {};
  const count = (id, field) => {
    usage[id] ??= { readers: 0, buyers: 0 };
    usage[id][field] += 1;
  };
  for (const { theme_id: themeId, purchased_theme_ids: purchased } of looks) {
    count(shownLook(themeId, purchased, prices), 'readers');
    for (const id of new Set(list(purchased))) count(id, 'buyers');
  }
  return {
    counts: {
      readers: Number(counts.readers),
      readersWithBooks: Number(counts.readers_with_books),
      books: Number(counts.books),
      goodreadsLinked: Number(counts.goodreads_linked),
      reviews: Number(counts.reviews),
      averageRating: counts.average_rating === null ? null : Math.round(Number(counts.average_rating) * 10) / 10,
      questions: Number(counts.questions),
      updates: Number(counts.updates),
    },
    usage,
    prices,
  };
}

export function readerView(row, prices) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    picture: row.picture,
    username: row.username,
    joinedAt: iso(row.created_at),
    signIn: [row.has_password && 'password', row.has_google && 'google'].filter(Boolean),
    themeId: shownLook(row.theme_id, row.purchased_theme_ids, prices),
    purchasedThemeIds: list(row.purchased_theme_ids),
    books: Number(row.book_count ?? 0),
    shelfUpdatedAt: iso(row.updated_at),
    goodreads: row.goodreads_id ? profileUrl(row.goodreads_id) : null,
    rating: row.rating ?? null,
  };
}

export function messageView(row) {
  return { id: String(row.id), kind: row.kind, text: row.body, email: row.email, sentAt: iso(row.created_at) };
}

export function reviewRowView(row) {
  return {
    id: row.user_id,
    rating: row.rating,
    text: row.body,
    name: row.name,
    email: row.email,
    username: row.username,
    picture: row.picture,
    updatedAt: iso(row.updated_at),
    featured: Boolean(row.featured),
  };
}
