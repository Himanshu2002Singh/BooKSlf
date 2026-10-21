// Rules for what readers and visitors send us: reviews, and the landing page's two forms.
import { HttpError } from '../utils/HttpError.js';
import { cleanEmail } from './email.validator.js';

export const MAX_FEEDBACK = 1000;

function text(value, tooLong) {
  const clean = typeof value === 'string' ? value.trim() : '';
  if (clean.length > MAX_FEEDBACK) throw new HttpError(400, tooLong);
  return clean;
}

export function cleanReview(input) {
  const { rating } = input ?? {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Pick a rating from 1 to 5 stars.');
  return { rating, body: text(input.text, `Keep your review under ${MAX_FEEDBACK} characters.`) };
}

// 'updates': an email or social handle for news of new themes. 'question': a question, which
// needs an email so it can be answered. A signed-in reader's account email is used when none is given.
export function cleanMessage(input, user) {
  const { kind } = input ?? {};
  if (kind !== 'updates' && kind !== 'question') throw new HttpError(400, 'Unknown form.');
  const body = text(input.text, `Keep it under ${MAX_FEEDBACK} characters.`);
  if (!body) throw new HttpError(400, kind === 'question' ? 'Type your question first.' : 'Add your email or a social handle first.');
  const email = input.email ? cleanEmail(input.email) : user?.email ?? null;
  if (kind === 'question' && !email) throw new HttpError(400, 'Add your email so we can answer you.');
  return { kind, body, email, userId: user?.id ?? null };
}
