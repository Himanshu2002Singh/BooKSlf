// Reads a reader's public Goodreads shelves through Goodreads' active embed widgets.
// Goodreads closed its API in 2020 and retired RSS feeds in 2024, but widget feeds
// remain publicly accessible for public profiles.
import { HttpError } from '../utils/HttpError.js';

const ORIGIN = 'https://www.goodreads.com';
const SHELVES = ['read', 'currently-reading'];
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': '*/*',
};

// Accepts a numeric id, a profile URL (/user/show/123-name or /review/list/123) or a
// vanity name / URL (goodreads.com/hollandmckay). Only goodreads.com is ever fetched.
export async function resolveUserId(input) {
  const value = String(input ?? '').trim();
  console.log('[goodreads] resolveUserId called with input:', value);
  if (!value) throw new HttpError(400, 'Paste your Goodreads profile link or user ID.');
  const numeric = value.match(/^(\d{1,12})(?:-[\w-]*)?$/) ?? value.match(/goodreads\.com\/(?:user\/show|review\/(?:list|custom_widget|grid_widget)(?:_rss)?)\/(\d{1,12})/i);
  if (numeric) {
    console.log('[goodreads] Successfully parsed numeric user ID:', numeric[1]);
    return numeric[1];
  }

  const vanity = value.replace(/^https?:\/\/(www\.)?goodreads\.com\//i, '').replace(/[/?#].*$/, '');
  console.log('[goodreads] Attempting vanity resolution for:', vanity);
  if (!/^[A-Za-z0-9_.-]{2,40}$/.test(vanity)) {
    console.warn('[goodreads] Invalid vanity format:', vanity);
    throw new HttpError(400, 'That doesn’t look like a Goodreads profile link or user ID.');
  }
  const vanityUrl = `${ORIGIN}/${encodeURIComponent(vanity)}`;
  console.log('[goodreads] Fetching vanity profile page:', vanityUrl);
  const response = await fetch(vanityUrl, { headers: HEADERS, redirect: 'follow' });
  console.log('[goodreads] Vanity response status:', response.status, 'redirected to:', response.url);
  const html = await response.text();
  const id = response.url.match(/\/user\/show\/(\d+)/)?.[1]
    ?? html.match(/user\/show\/(\d+)/)?.[1];
  console.log('[goodreads] Extracted user ID from vanity page:', id);
  if (!response.ok || !id) {
    console.warn('[goodreads] Failed to resolve vanity profile. Status:', response.status);
    throw new HttpError(404, `We couldn’t find a Goodreads profile called “${vanity}”.`);
  }
  return id;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decode(text = '') {
  return text
    .trim()
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
    .replace(/&(#x?[\da-f]+|\w+);/gi, (match, code) => {
      if (code[0] !== '#') return ENTITIES[code] ?? match;
      return String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
    })
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces.
    .replace(/\s+/g, ' ')
    .trim();
}

function field(item, name) {
  return decode(item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]);
}

// "A Kingdom of Flesh and Fire (Blood and Ash, #2)" -> title + series.
function splitSeries(fullTitle) {
  const match = fullTitle.match(/^(.*\S)\s*\(([^()]*#\s*[\d.]+)\)$/);
  return match ? { title: match[1], series: match[2] } : { title: fullTitle, series: null };
}

function parseItems(xml, shelf) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const { title, series } = splitSeries(field(item, 'title'));
    const rating = Number(field(item, 'user_rating'));
    const year = Number(field(item, 'book_published'));
    return {
      goodreadsId: field(item, 'book_id'),
      title,
      series,
      author: field(item, 'author_name') || 'Goodreads Author',
      isbn: field(item, 'isbn') || null,
      cover: field(item, 'book_large_image_url') || field(item, 'book_image_url') || null,
      rating: rating >= 1 && rating <= 5 ? rating : null,
      year: Number.isInteger(year) && year > 0 ? year : null,
      readAt: field(item, 'user_read_at') || null,
      shelf,
    };
  });
}

function parseStars(ratingHtml) {
  const activeStars = (ratingHtml.match(/gr_flat_red_star_active/g) || []).length;
  return activeStars > 0 && activeStars <= 5 ? activeStars : null;
}

function unescapeWidget(rawJs) {
  const start = rawJs.indexOf("var widget_code = '");
  if (start === -1) return '';
  const contentStart = start + "var widget_code = '".length;
  const end = rawJs.lastIndexOf("';");
  const cutEnd = end !== -1 ? end : rawJs.indexOf("'\n  var widget_div");
  return rawJs.substring(contentStart, cutEnd !== -1 ? cutEnd : rawJs.length)
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\\//g, '/');
}

function parseCustomWidget(rawJs, shelf) {
  const html = unescapeWidget(rawJs);
  if (!html) return [];

  const items = [...html.matchAll(/<div class="gr_custom_each_container_">([\s\S]*?)<\/div>\s*<\/div>/g)];
  return items.map(([, block]) => {
    const rawTitle = block.match(/<div class="gr_custom_title_">\s*<a[^>]*>([\s\S]*?)<\/a>/)?.[1]
      || block.match(/<a\s+title="([^"]*)"/)?.[1]
      || '';
    const title = decode(rawTitle.replace(/<[^>]+>/g, ''));

    const rawAuthor = block.match(/<div class="gr_custom_author_">\s*by\s*<a[^>]*>([\s\S]*?)<\/a>/)?.[1]
      || block.match(/<div class="gr_custom_author_">([\s\S]*?)<\/div>/)?.[1]
      || '';
    const author = decode(rawAuthor.replace(/<[^>]+>/g, '').replace(/^by\s+/i, '')) || 'Goodreads Author';

    const coverRaw = block.match(/<div class="gr_custom_book_container_">[\s\S]*?<img[^>]*src="([^"]*)"/)?.[1] || null;
    const cover = coverRaw ? coverRaw.replace(/\._S[YX]\d+_(\.\w+)$/, '$1') : null;

    const reviewId = block.match(/\/review\/show\/(\d+)/)?.[1] || null;
    const bookId = (coverRaw && coverRaw.match(/\/books\/\d+[a-z]?\/(\d+)/)?.[1]) || reviewId;

    const ratingHtml = block.match(/<div class="gr_custom_rating_">([\s\S]*?)<\/div>/)?.[1] || '';
    const rating = parseStars(ratingHtml);

    return {
      goodreadsId: bookId || reviewId,
      title,
      author,
      cover,
      rating,
      shelf,
    };
  }).filter(b => b.title && b.goodreadsId);
}

function parseGridWidget(rawJs, shelf) {
  const html = unescapeWidget(rawJs);
  if (!html) return [];

  const items = [...html.matchAll(/<div class="gr_grid_book_container">([\s\S]*?)<\/div>/g)];
  return items.map(([, block]) => {
    const rawTitle = block.match(/<a\s+title="([^"]*)"/)?.[1]
      || block.match(/<img[^>]*alt="([^"]*)"/)?.[1]
      || '';
    const title = decode(rawTitle);

    const coverRaw = block.match(/<img[^>]*src="([^"]*)"/)?.[1] || null;
    const cover = coverRaw ? coverRaw.replace(/\._S[YX]\d+_(\.\w+)$/, '$1') : null;

    const reviewId = block.match(/\/review\/show\/(\d+)/)?.[1] || null;
    const bookId = (coverRaw && coverRaw.match(/\/books\/\d+[a-z]?\/(\d+)/)?.[1]) || reviewId;

    return {
      goodreadsId: bookId || reviewId,
      title,
      author: 'Goodreads Author',
      cover,
      rating: null,
      shelf,
    };
  }).filter(b => b.title && b.goodreadsId);
}

async function fetchShelf(userId, shelf) {
  console.log(`[goodreads] Fetching shelf "${shelf}" for user ${userId}`);

  // 1. Try Custom Widget first (provides title, author, cover, rating)
  const customUrl = `${ORIGIN}/review/custom_widget/${userId}?shelf=${shelf}`;
  let response;
  try {
    response = await fetch(customUrl, { headers: HEADERS });
  } catch (networkError) {
    console.error(`[goodreads] Network fetch error for ${customUrl}:`, networkError.message);
    throw new HttpError(502, `Failed to reach Goodreads servers: ${networkError.message}`);
  }

  if (response.status === 401 || response.status === 403) {
    console.warn(`[goodreads] Profile is private: status ${response.status}`);
    throw new HttpError(403, 'This Goodreads profile is private. Set it to public in Goodreads (Settings › Privacy), then try again.');
  }

  if (response.status === 404) {
    console.warn(`[goodreads] Goodreads returned 404 for ${customUrl}`);
    throw new HttpError(404, 'We couldn’t find that Goodreads profile. Check the link or user ID.');
  }

  if (!response.ok) {
    console.warn(`[goodreads] Goodreads error ${response.status} for user ${userId} (${shelf})`);
    throw new HttpError(502, 'Goodreads didn’t respond. Try again in a minute.');
  }

  const text = await response.text();
  if (/<rss|<feed|<item/i.test(text)) {
    const books = parseItems(text, shelf);
    console.log(`[goodreads] Parsed ${books.length} books from XML/RSS for ${shelf}`);
    if (books.length > 0) return books;
  }

  const books = parseCustomWidget(text, shelf);
  console.log(`[goodreads] Custom widget returned ${books.length} books for ${shelf}`);
  if (books.length > 0) {
    return books;
  }

  // 2. Fallback to Grid Widget if custom widget returned empty
  const gridUrl = `${ORIGIN}/review/grid_widget/${userId}.${shelf}?num_books=50`;
  console.log(`[goodreads] Trying grid widget fallback: ${gridUrl}`);
  try {
    const gridResponse = await fetch(gridUrl, { headers: HEADERS });
    if (gridResponse.ok) {
      const gridText = await gridResponse.text();
      const gridBooks = parseGridWidget(gridText, shelf);
      console.log(`[goodreads] Grid widget returned ${gridBooks.length} books for ${shelf}`);
      if (gridBooks.length > 0) {
        return gridBooks;
      }
    }
  } catch (err) {
    console.warn('[goodreads] Grid widget fallback failed:', err.message);
  }

  return [];
}

export function profileUrl(userId) {
  return `${ORIGIN}/user/show/${userId}`;
}

// Every book on a Goodreads user's Read and Currently Reading shelves, de-duplicated across them.
export async function readShelves(userId) {
  const shelves = await Promise.all(SHELVES.map(shelf => fetchShelf(userId, shelf)));
  const seen = new Set();
  return shelves.flat().filter(book => {
    const key = book.goodreadsId || `${book.title}|${book.author}`.toLowerCase();
    if (!book.title || !book.author || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Goodreads books as shelf books (see validators/shelf.validator.js).
export function toShelfBooks(books) {
  return books.map(book => ({
    id: `gr-${book.goodreadsId}`,
    title: book.title,
    author: book.author,
    cover: book.cover,
    source: 'goodreads',
    ...(book.rating ? { rating: book.rating } : {}),
    ...(book.year ? { year: book.year } : {}),
  }));
}
