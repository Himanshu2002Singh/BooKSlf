import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import ReaderRow from '../components/ReaderRow.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { count, plural } from '../format.js';

const SEARCH_DELAY = 300;
const COLUMNS = ['Reader', 'Shelf link', 'Look', 'Bought', 'Books', 'Goodreads', 'Review', 'Joined'];

// /admin/readers — every reader, newest first, 50 to a page. The search matches a name, email or username.
export default function ReadersPage({ admin }) {
  const { request } = admin;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const searching = Boolean(search.trim());

  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      request(`/readers?q=${encodeURIComponent(search.trim())}&page=${page}`)
        .then(result => { if (live) { setData(result); setError(''); } })
        .catch(failure => live && setError(failure.message));
    }, search ? SEARCH_DELAY : 0);
    return () => { live = false; window.clearTimeout(timer); };
  }, [request, search, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const first = data ? (data.page - 1) * data.pageSize + 1 : 0;

  return (
    <section className="ap-card ap-card--flush" aria-label="Readers" aria-busy={!data}>
      <div className="ap-toolbar">
        <label className="ap-search">
          <Icon name="search" />
          <span className="sr-only">Search readers</span>
          <input type="search" placeholder="Search by name, email or username" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        </label>
        {data && <span className="ap-toolbar__note">{searching ? `${count(data.total)} found` : plural(data.total, 'reader')}</span>}
      </div>
      {error && <p className="ap-alert ap-alert--inset" role="alert"><Icon name="alert" />{error}</p>}
      {!data ? <Skeleton rows={6} height={52} /> : data.readers.length ? (
        <div className="ap-table-wrap">
          <table className="ap-table ap-readers">
            <thead>
              <tr>{COLUMNS.map(column => <th key={column} scope="col" className={column === 'Books' ? 'ap-num' : undefined}>{column}</th>)}</tr>
            </thead>
            <tbody>{data.readers.map(reader => <ReaderRow key={reader.id} reader={reader} />)}</tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="users" title={searching ? 'No readers match' : 'No readers yet'}>
          {searching ? 'Try part of a name, an email or a username.' : 'Readers show up here as soon as they sign up.'}
        </EmptyState>
      )}
      {data && data.total > data.pageSize && (
        <footer className="ap-pager">
          <span>{count(first)}–{count(first + data.readers.length - 1)} of {count(data.total)}</span>
          <div>
            <button type="button" className="ap-btn ap-btn--quiet" disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon name="chevronLeft" size={16} />Newer</button>
            <button type="button" className="ap-btn ap-btn--quiet" disabled={page >= pages} onClick={() => setPage(page + 1)}>Older<Icon name="chevronRight" size={16} /></button>
          </div>
        </footer>
      )}
    </section>
  );
}
