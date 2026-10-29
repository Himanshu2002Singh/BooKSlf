import FlowShell from '../components/FlowShell.jsx';
import AddBooks from '../features/books/AddBooks.jsx';
import usePageTitle from '../app/usePageTitle.js';

// /books — step 2 of setup: Goodreads, a shelf photo or the library.
export default function BooksPage({ app }) {
  usePageTitle('Add your books');
  return (
    <FlowShell
      navRight={
        <button type="button" className="sp-btn" onClick={() => app.navigate('/shelf')}>
          Back to Shelf
        </button>
      }
    >
      <AddBooks
        books={app.books}
        goodreads={app.goodreads}
        onConnectGoodreads={app.connectGoodreads}
        onSyncGoodreads={app.syncGoodreads}
        onBooksChange={app.setBooks}
        onContinue={app.finishBooks}
        onBackToShelf={() => app.navigate('/shelf')}
      />
    </FlowShell>
  );
}

