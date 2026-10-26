// What the home page shows of a review the admin picked: the words and the reader's public
// profile (never their email), with the look their shelf shows.
import { shownLook } from './shelf.view.js';

export function featuredReviewView(row, prices) {
  return {
    name: row.name,
    picture: row.picture,
    username: row.username,
    themeId: shownLook(row.theme_id, row.purchased_theme_ids, prices),
    text: row.body,
  };
}
