// /api/admin/* — the admin panel: sign-in, readers and their looks, look prices, landing messages, and
// reviews and which of them the home page shows.
import * as Admin from '../models/admin.model.js';
import * as Message from '../models/message.model.js';
import * as Review from '../models/review.model.js';
import * as ThemePrice from '../models/themePrice.model.js';
import { adminKey, matchesAdmin } from '../utils/admin.js';
import { HttpError } from '../utils/HttpError.js';
import { endAdminSession, startAdminSession } from '../utils/session.js';
import { cleanPrice } from '../validators/price.validator.js';
import { messageView, overviewView, readerView, reviewRowView } from '../views/admin.view.js';

const PAGE_SIZE = 50;

export function login(request, response) {
  if (!matchesAdmin(request.body?.email, request.body?.password)) throw new HttpError(401, 'Email or password is incorrect.');
  startAdminSession(request, response, adminKey());
  response.json({ ok: true });
}

export function logout(request, response) {
  endAdminSession(request, response);
  response.json({ ok: true });
}

// Totals, plus how many readers show and have bought each look, with the current prices.
export async function overview(request, response) {
  const [counts, looks, prices] = await Promise.all([Admin.counts(), Admin.looks(), ThemePrice.all()]);
  response.json(overviewView(counts, looks, prices));
}

// GET /api/admin/readers?q=<name, email or username>&page=<n>
export async function readers(request, response) {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const search = String(request.query.q ?? '').trim().slice(0, 100);
  const [{ rows, total }, prices] = await Promise.all([Admin.readers({ search, page, pageSize: PAGE_SIZE }), ThemePrice.all()]);
  response.json({ readers: rows.map(row => readerView(row, prices)), total, page, pageSize: PAGE_SIZE });
}

// PUT /api/admin/themes/:id { inr, usd } — answers every look's prices.
export async function setThemePrice(request, response) {
  await ThemePrice.update(request.params.id, cleanPrice(request.body));
  response.json({ prices: await ThemePrice.all() });
}

export async function messages(request, response) {
  response.json({ messages: (await Message.list()).map(messageView) });
}

export async function deleteMessage(request, response) {
  await Message.remove(request.params.id);
  response.json({ ok: true });
}

export async function reviews(request, response) {
  response.json({ reviews: (await Review.list()).map(reviewRowView) });
}

// PUT /api/admin/reviews/:id { featured } — shows the reader's review on the home page, or takes it off.
export async function featureReview(request, response) {
  const { featured } = request.body ?? {};
  if (typeof featured !== 'boolean') throw new HttpError(400, 'Send featured: true or false.');
  await Review.setFeatured(request.params.id, featured);
  response.json({ ok: true });
}
