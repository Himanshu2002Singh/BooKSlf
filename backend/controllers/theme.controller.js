import * as ThemePrice from '../models/themePrice.model.js';

// GET /api/themes/prices — what each premium look costs, as set in the admin panel:
// { prices: { <theme id>: { inr, usd } } }. Works signed out (the landing page and legal pages show prices).
export async function getPrices(request, response) {
  response.json({ prices: await ThemePrice.all() });
}
