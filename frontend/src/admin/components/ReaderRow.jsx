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
        <div className="ap-person">
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
          ? <a className="ap-link" href={`/${reader.username}`} target="_blank" rel="noreferrer">/{reader.username}<Icon name="external" size={13} /></a>
          : <span className="ap-muted">Not claimed yet</span>}
      </td>
      <td data-label="Look"><span className="ap-chip" data-tone={look.paid ? 'brand' : undefined}>{look.name}</span></td>
      <td data-label="Bought">
        {reader.purchasedThemeIds.length
          ? <span className="ap-chips">{reader.purchasedThemeIds.map(id => <span key={id} className="ap-chip" data-tone="green">{getTheme(id).name}</span>)}</span>
          : <span className="ap-muted">—</span>}
      </td>
      <td data-label="Books" className="ap-num">{count(reader.books)}</td>
      <td data-label="Goodreads">
        {reader.goodreads
          ? <a className="ap-link" href={reader.goodreads} target="_blank" rel="noreferrer"><Icon name="check" size={14} />Connected</a>
          : <span className="ap-muted">—</span>}
      </td>
      <td data-label="Review">{reader.rating ? <Stars value={reader.rating} /> : <span className="ap-muted">—</span>}</td>
      <td data-label="Joined">
        <div>
          {day(reader.joinedAt)}
          {reader.shelfUpdatedAt && <small className="ap-block ap-muted">Shelf edited {timeAgo(reader.shelfUpdatedAt)}</small>}
        </div>
      </td>
    </tr>
  );
}
