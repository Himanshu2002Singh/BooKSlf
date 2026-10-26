import * as Review from '../models/review.model.js';
import * as ThemePrice from '../models/themePrice.model.js';
import { featuredReviewView } from '../views/review.view.js';

// GET /api/reviews — the reviews the admin picked for the home page, newest pick first:
// { reviews: [{ name, picture, username, themeId, text }] }. Works signed out.
export async function featured(request, response) {
  const [rows, prices] = await Promise.all([Review.featured(), ThemePrice.all()]);
  response.json({ reviews: rows.map(row => featuredReviewView(row, prices)) });
}
