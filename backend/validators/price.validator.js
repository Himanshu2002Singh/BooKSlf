import { HttpError } from '../utils/HttpError.js';

// A premium look's prices from the admin panel: whole rupees charged at checkout (before GST)
// and the whole-dollar badge shown on the theme card.
export function cleanPrice(input) {
  const { inr, usd } = input ?? {};
  if (!Number.isInteger(inr) || inr < 1 || inr > 100000) throw new HttpError(400, 'Set the rupee price as a whole number from 1 to 100000.');
  if (!Number.isInteger(usd) || usd < 1 || usd > 1000) throw new HttpError(400, 'Set the dollar badge as a whole number from 1 to 1000.');
  return { inr, usd };
}
