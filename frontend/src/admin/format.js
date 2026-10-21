// Numbers, money and dates as the admin pages show them.
export const count = value => Number(value ?? 0).toLocaleString('en-IN');
export const plural = (value, word, words = `${word}s`) => `${count(value)} ${value === 1 ? word : words}`;
export const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const day = value => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const moment = value => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// Rupees per dollar, fetched once per visit. Falls back to a recent rate when the lookup fails.
const FALLBACK_RATE = 88;
let rateLookup;
export function usdRate() {
  rateLookup ??= fetch('https://open.er-api.com/v6/latest/USD')
    .then(response => response.json())
    .then(data => {
      const rate = Number(data?.rates?.INR);
      return rate > 0 ? { rate, live: true } : { rate: FALLBACK_RATE, live: false };
    })
    .catch(() => ({ rate: FALLBACK_RATE, live: false }));
  return rateLookup;
}
