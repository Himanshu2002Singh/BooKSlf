// "holland mckay" -> "Holland" for "Holland’s Reading Life".
export function firstName(name = '') {
  const first = name.trim().split(/\s+/)[0] || '';
  return first ? `${first.charAt(0).toLocaleUpperCase()}${first.slice(1)}` : '';
}

export function shelfTitle(name) {
  const first = firstName(name);
  return first ? `${first}’s Reading Life` : 'Your Reading Life';
}

// Goodreads, Open Library and shelf photos often give a book's title with its subtitle after a
// colon ("Atomic Habits: An Easy & Proven Way to Build…") and its series in brackets
// ("(Wings of Fire, #1)"). Books are shown by the main title; a full title this short stays
// whole, so "Star Wars: A New Hope" keeps its second half. The book popup shows the subtitle.
const SHORT_TITLE = 32;

export function titleParts(title) {
  const text = (title ?? '').trim();
  const full = text.replace(/\s*\([^()]*\)\s*$/, '').trim() || text;
  const colon = full.indexOf(': ');
  if (full.length <= SHORT_TITLE || colon < 1) return { main: full, subtitle: '' };
  return { main: full.slice(0, colon).trim(), subtitle: full.slice(colon + 2).trim() };
}

export const shortTitle = title => titleParts(title).main;
