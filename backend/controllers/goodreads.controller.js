// /api/goodreads — connect the reader's Goodreads profile, then sync new books from it.
import * as GoodreadsLink from '../models/goodreadsLink.model.js';
import * as Shelf from '../models/shelf.model.js';
import { readShelves, resolveUserId, toShelfBooks } from '../services/goodreads.service.js';
import { HttpError } from '../utils/HttpError.js';
import { goodreadsView } from '../views/user.view.js';

// Automatic syncs (the app sends one each time it opens) read Goodreads at most this often.
const AUTO_SYNC_MINUTES = 10;

// PUT /api/goodreads { profile: <profile link, vanity name or user id> }
// Adds the profile's Read and Currently Reading books to the shelf and keeps the profile linked.
// Answers { added, found, goodreads }: added is what the shelf didn't have yet.
export async function connect(request, response) {
  const goodreadsId = await resolveUserId(request.body?.profile);
  const books = await readShelves(goodreadsId);
  if (!books.length) throw new HttpError(404, 'No books found on this profile’s Read or Currently Reading shelves.');
  const added = await Shelf.addBooks(request.user.id, toShelfBooks(books));
  const link = await GoodreadsLink.save(request.user.id, { goodreadsId, seenIds: books.map(book => book.goodreadsId) });
  response.json({ added, found: books.length, goodreads: goodreadsView(link) });
}

// POST /api/goodreads/sync { force }
// Adds books put on the linked profile since it was last read. A book the reader removed from
// their shelf stays removed. Without force, a sync within 10 minutes of the last read is skipped.
export async function sync(request, response) {
  let link = await GoodreadsLink.get(request.user.id);
  if (!link) throw new HttpError(404, 'Connect your Goodreads profile first.');
  let added = [];
  if (request.body?.force === true || Date.now() - new Date(link.syncedAt) >= AUTO_SYNC_MINUTES * 60_000) {
    const books = await readShelves(link.goodreadsId);
    const seen = new Set(link.seenIds);
    added = await Shelf.addBooks(request.user.id, toShelfBooks(books.filter(book => !seen.has(book.goodreadsId))));
    link = await GoodreadsLink.save(request.user.id, { goodreadsId: link.goodreadsId, seenIds: [...seen, ...books.map(book => book.goodreadsId)] });
  }
  response.json({ added, goodreads: goodreadsView(link) });
}
