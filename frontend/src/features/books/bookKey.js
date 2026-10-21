// Same title + author (ignoring case and spacing) means the same book, whatever its source.
export function bookKey(book) {
  const normalize = (value = '') => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return `${normalize(book.title)}\u0000${normalize(book.author)}`;
}

// The shelf plus the picks it doesn't have yet: a pick with the same title and author, or the
// same id (a scanned book can match one picked from the library), as a book already there is skipped.
export function mergeBooks(shelf, picks, source) {
  const taken = new Set(shelf.flatMap(book => [bookKey(book), book.id]));
  const added = picks.filter(book => {
    if (taken.has(bookKey(book)) || taken.has(book.id)) return false;
    taken.add(bookKey(book)).add(book.id);
    return true;
  });
  return [...shelf, ...(source ? added.map(book => ({ ...book, source })) : added)];
}
