import { getTheme } from '../../data/themes.js';
import { timeAgo } from '../../lib/time.js';
import { count, day } from '../format.js';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Stars from './Stars.jsx';

const SIGN_IN = { password: 'Email & password', google: 'Google' };

// One reader in the readers table. On phones each row becomes a card with labelled cells.
export default function ReaderRow({ reader }) {
  const look = getTheme(reader.themeId);
  return (
    <tr>
      <td data-label="Reader">
        <div className="ad-person">
          <Avatar name={reader.name} email={reader.email} picture={reader.picture} />
          <div>
            <b>{reader.name}</b>
            <span>{reader.email}</span>
            <small>{reader.signIn.map(method => SIGN_IN[method]).join(' · ')}</small>
          </div>
        </div>
      </td>
      <td data-label="Shelf link">
        {reader.username
          ? <a className="ad-link" href={`/${reader.username}`} target="_blank" rel="noreferrer">/{reader.username}<Icon name="external" size={13} /></a>
          : <span className="ad-muted">Not claimed yet</span>}
      </td>
      <td data-label="Look"><span className="ad-chip" data-tone={look.paid ? 'brand' : undefined}>{look.name}</span></td>
      <td data-label="Bought">
        {reader.purchasedThemeIds.length
          ? <span className="ad-chips">{reader.purchasedThemeIds.map(id => <span key={id} className="ad-chip" data-tone="green">{getTheme(id).name}</span>)}</span>
          : <span className="ad-muted">—</span>}
      </td>
      <td data-label="Books" className="ad-num">{count(reader.books)}</td>
      <td data-label="Goodreads">
        {reader.goodreads
          ? <a className="ad-link" href={reader.goodreads} target="_blank" rel="noreferrer"><Icon name="check" size={14} />Connected</a>
          : <span className="ad-muted">—</span>}
      </td>
      <td data-label="Review">{reader.rating ? <Stars value={reader.rating} /> : <span className="ad-muted">—</span>}</td>
      <td data-label="Joined">
        <div>
          {day(reader.joinedAt)}
          {reader.shelfUpdatedAt && <small className="ad-block ad-muted">Shelf edited {timeAgo(reader.shelfUpdatedAt)}</small>}
        </div>
      </td>
    </tr>
  );
}
