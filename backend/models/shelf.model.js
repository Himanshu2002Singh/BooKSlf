// The shelves table: one row per reader with their books, chosen look and bought looks.
import { query } from '../db/pool.js';
import { bookKey, cleanShelf } from '../validators/shelf.validator.js';

// Runs inside the transaction that creates the reader (see user.model.js).
export async function insertEmpty(connection, userId) {
  await connection.execute(
    "INSERT INTO shelves (user_id, theme_id, purchased_theme_ids, books) VALUES (?, 'light-grid', JSON_ARRAY(), JSON_ARRAY())",
    [userId],
  );
}

export async function get(userId) {
  const row = (await query('SELECT * FROM shelves WHERE user_id = ?', [userId]))[0];
  return cleanShelf(row && { themeId: row.theme_id, purchasedThemeIds: row.purchased_theme_ids, books: row.books });
}

export async function save(userId, shelf) {
  const clean = cleanShelf(shelf);
  await query(
    'UPDATE shelves SET theme_id = ?, purchased_theme_ids = ?, books = ? WHERE user_id = ?',
    [clean.themeId, JSON.stringify(clean.purchasedThemeIds), JSON.stringify(clean.books), userId],
  );
  return clean;
}

// Adds the books that aren't on the shelf yet (no same id, nor same title and author) to its end,
// and returns them.
export async function addBooks(userId, books) {
  const shelf = await get(userId);
  const taken = new Set(shelf.books.flatMap(book => [book.id, bookKey(book)]));
  const fresh = cleanShelf({ books }).books.filter(book => {
    if (taken.has(book.id) || taken.has(bookKey(book))) return false;
    taken.add(book.id).add(bookKey(book));
    return true;
  });
  if (!fresh.length) return [];
  const saved = await save(userId, { ...shelf, books: [...shelf.books, ...fresh] });
  return saved.books.slice(shelf.books.length); // Fewer than `fresh` once the shelf is full.
}

export async function unlockTheme(userId, themeId) {
  const current = await get(userId);
  const purchased = new Set(current.purchasedThemeIds || []);
  purchased.add(themeId);
  const updatedPurchased = [...purchased];
  await query(
    'UPDATE shelves SET theme_id = ?, purchased_theme_ids = ? WHERE user_id = ?',
    [themeId, JSON.stringify(updatedPurchased), userId],
  );
  return get(userId);
}
