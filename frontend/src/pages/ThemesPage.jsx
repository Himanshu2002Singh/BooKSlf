import FlowShell from '../components/FlowShell.jsx';
import catalog from '../data/books.js';
import ThemePicker from '../features/themes/ThemePicker.jsx';
import usePageTitle from '../app/usePageTitle.js';

// /themes — step 1 of setup: choose a look (paid looks go through checkout).
export default function ThemesPage({ app }) {
  usePageTitle('Choose your look');
  return (
    <FlowShell
      navRight={
        <button type="button" className="sp-btn" onClick={() => app.navigate('/shelf')}>
          Back to Shelf
        </button>
      }
    >
      <ThemePicker
        selectedTheme={app.theme}
        books={app.books.length ? app.books : catalog}
        purchasedThemeIds={app.purchasedThemeIds}
        onSelect={app.selectTheme}
        onBuy={chosen => app.navigate(`/purchase?theme=${chosen.id}`)}
        onContinue={app.continueFromThemes}
        onBackToShelf={() => app.navigate('/shelf')}
      />
    </FlowShell>
  );
}

