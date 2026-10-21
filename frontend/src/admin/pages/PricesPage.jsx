import { themes } from '../../data/themes.js';
import LookCard from '../components/LookCard.jsx';

const premiumLooks = themes.filter(theme => theme.paid);
const freeLooks = themes.filter(theme => !theme.paid);

// /admin/prices — every look with a live preview and how it's used: the premium looks first, with
// their prices (rupees at checkout and the dollar card badge), then the free ones.
export default function PricesPage({ admin }) {
  const { overview, request, notify, refresh } = admin;
  const card = theme => (
    <LookCard key={theme.id} theme={theme} usage={overview.usage[theme.id]} price={overview.prices[theme.id]} request={request} notify={notify} onSaved={refresh} />
  );
  return (
    <div className="ap-sections">
      <section aria-labelledby="premium-title">
        <header className="ap-section-head">
          <h2 id="premium-title">Premium looks</h2>
          <p>New prices apply to checkouts straight away. Readers who already bought a look keep it.</p>
        </header>
        <div className="ap-looks">{premiumLooks.map(card)}</div>
      </section>
      <section aria-labelledby="free-title">
        <header className="ap-section-head">
          <h2 id="free-title">Free looks</h2>
          <p>Every reader can use these, so they have no price.</p>
        </header>
        <div className="ap-looks">{freeLooks.map(card)}</div>
      </section>
    </div>
  );
}
