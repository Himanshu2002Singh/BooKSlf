import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './HttpError.js';

// The admin panel has one admin, who signs in with ADMIN_EMAIL and ADMIN_PASSWORD from the
// server's environment (backend/.env, or the Vercel project's settings).
function credentials() {
  const email = String(process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD ?? '');
  if (!email || password.length < 12) throw new HttpError(503, 'The admin panel isn’t set up on this server yet.');
  return { email, password };
}

const digest = value => createHash('sha256').update(String(value ?? '')).digest();

// Compares in constant time, so response timing can't reveal how much of a guess was right.
export function matchesAdmin(email, password) {
  const admin = credentials();
  const emailMatches = timingSafeEqual(digest(String(email ?? '').trim().toLowerCase()), digest(admin.email));
  const passwordMatches = timingSafeEqual(digest(password), digest(admin.password));
  return emailMatches && passwordMatches;
}

// Stored in the admin's session cookie. It changes when ADMIN_EMAIL or ADMIN_PASSWORD does,
// which signs the admin out everywhere. Keyed with SESSION_SECRET, so it can't be guessed back.
export function adminKey() {
  const { email, password } = credentials();
  return createHmac('sha256', String(process.env.SESSION_SECRET ?? '')).update(`admin\n${email}\n${password}`).digest('base64url').slice(0, 32);
}
