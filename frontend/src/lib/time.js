const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

// How long ago something happened: "just now", "5 minutes ago", "yesterday", "12 days ago".
export function timeAgo(iso) {
  const minutes = Math.round((Date.now() - new Date(iso)) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return relative.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  return hours < 24 ? relative.format(-hours, 'hour') : relative.format(-Math.round(hours / 24), 'day');
}
