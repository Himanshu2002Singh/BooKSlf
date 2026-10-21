// /api/me — the signed-in reader, their shelf, their username and their review.
import * as GoodreadsLink from '../models/goodreadsLink.model.js';
import * as Review from '../models/review.model.js';
import * as Shelf from '../models/shelf.model.js';
import * as User from '../models/user.model.js';
import { cleanReview } from '../validators/feedback.validator.js';
import { accountView, reviewView, userView } from '../views/user.view.js';

// The account JSON for GET /api/me and every sign-in (see accountView).
export async function accountOf(user) {
  const [shelf, review, goodreads] = await Promise.all([Shelf.get(user.id), Review.findByUser(user.id), GoodreadsLink.get(user.id)]);
  return accountView(user, { shelf, review, goodreads });
}

// Answers { user: null } when signed out, so the app can tell "signed out" from an error.
export async function getAccount(request, response) {
  const { user } = request;
  response.json(user ? await accountOf(user) : { user: null });
}

export async function saveShelf(request, response) {
  response.json({ shelf: await Shelf.save(request.user.id, request.body) });
}

export async function claimUsername(request, response) {
  const user = await User.claimUsername(request.user.id, request.body.username);
  response.json({ user: userView(user) });
}

// PUT /api/me/review { rating: 1–5, text } — adds or replaces the reader's review.
export async function saveReview(request, response) {
  const review = await Review.save(request.user.id, cleanReview(request.body));
  response.json({ review: reviewView(review) });
}
