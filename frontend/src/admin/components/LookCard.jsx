import { useState } from 'react';
import catalog from '../../data/books.js';
import { totalWithGst } from '../../data/themes.js';
import { ThemePreview } from '../../features/shelf/ShelfView.jsx';
import { count, rupees } from '../format.js';
import Icon from './Icon.jsx';

const WHOLE_NUMBER = /^[1-9]\d*$/;

// One look: a live preview, how many shelves show it and how many readers bought it, and for
// a premium look its prices: whole rupees at checkout (before GST) and the dollar card badge.
export default function LookCard({ theme, usage = { readers: 0, buyers: 0 }, price, request, notify, onSaved }) {
  const saved = { inr: String(price?.inr ?? ''), usd: String(price?.usd ?? '') };
  const [form, setForm] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const changed = Boolean(price) && (form.inr !== saved.inr || form.usd !== saved.usd);
  const valid = WHOLE_NUMBER.test(form.inr) && WHOLE_NUMBER.test(form.usd);
  const hintId = `${theme.id}-price-hint`;

  const update = field => event => {
    setForm(current => ({ ...current, [field]: event.target.value.trim() }));
    setError('');
  };

  async function save(event) {
    event.preventDefault();
    if (!valid) {
      setError('Use whole numbers above zero.');
      return;
    }
    setSaving(true);
    try {
      await request(`/themes/${theme.id}`, { method: 'PUT', body: { inr: Number(form.inr), usd: Number(form.usd) } });
      await onSaved();
      notify(`${theme.name} now costs ${rupees.format(Number(form.inr))} + GST.`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="ad-card ad-look">
      <div className="ad-look__thumb"><ThemePreview theme={theme} books={catalog} /></div>
      <div className="ad-look__body">
        <header className="ad-look__head">
          <h2>{theme.name}</h2>
          <span className="ad-chip" data-tone={theme.paid ? 'brand' : 'green'}>{theme.paid ? 'Premium' : 'Free'}</span>
        </header>
        <dl className="ad-look__stats">
          <div><dt>Shelves showing it</dt><dd>{count(usage.readers)}</dd></div>
          <div><dt>Bought by</dt><dd>{theme.paid ? count(usage.buyers) : '—'}</dd></div>
        </dl>
        {price ? (
          <form className="ad-price" onSubmit={save} noValidate>
            <div className="ad-price__fields">
              <label className="ad-field">
                <span>Checkout price</span>
                <span className="ad-affix"><i aria-hidden="true">₹</i><input inputMode="numeric" value={form.inr} onChange={update('inr')} aria-label={`Checkout price for ${theme.name}, in rupees`} aria-describedby={hintId} aria-invalid={Boolean(error)} /></span>
              </label>
              <label className="ad-field">
                <span>Card badge</span>
                <span className="ad-affix"><i aria-hidden="true">$</i><input inputMode="numeric" value={form.usd} onChange={update('usd')} aria-label={`Card badge for ${theme.name}, in dollars`} aria-describedby={hintId} aria-invalid={Boolean(error)} /></span>
              </label>
            </div>
            <p id={hintId} className={error ? 'ad-field-error' : 'ad-hint'} role={error ? 'alert' : undefined}>
              {error || (valid ? `Readers pay ${rupees.format(totalWithGst(Number(form.inr)))} with 18% GST.` : 'Use whole numbers above zero.')}
            </p>
            {changed && (
              <div className="ad-price__actions">
                <button type="button" className="ad-btn ad-btn--quiet" onClick={() => { setForm(saved); setError(''); }} disabled={saving}>Undo</button>
                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save prices'}</button>
              </div>
            )}
          </form>
        ) : (
          <p className="ad-look__free"><Icon name="check" size={16} />Free for every reader</p>
        )}
      </div>
    </article>
  );
}
