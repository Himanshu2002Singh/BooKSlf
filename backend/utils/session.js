import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './HttpError.js';

// Sessions are a signed, HttpOnly cookie carrying the user id and their session version.
const COOKIE = 'bs_session';
const SESSION_DAYS = 30;
// The admin panel's session: its own cookie, sent only to /api/admin, for a working day.
const ADMIN_COOKIE = 'bs_admin';
const ADMIN_PATH = '/api/admin';
const ADMIN_HOURS = 12;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new HttpError(503, 'Accounts aren’t set up on this server yet.');
  return value;
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

// Behind a proxy (Vercel, Render) Express reports https via `trust proxy`; locally it's plain http.
function secure(request) {
  return request.secure || process.env.NODE_ENV === 'production';
}

function cookies(request) {
  return Object.fromEntries(String(request.headers.cookie ?? '').split(';')
    .map(part => part.trim().split('='))
    .filter(([key, value]) => key && value !== undefined)
    .map(([key, ...rest]) => [key, decodeURIComponent(rest.join('='))]));
}

function setCookie(request, response, name, value, { maxAge, path = '/', sameSite = 'Lax' }) {
  response.setHeader('Set-Cookie', [
    `${name}=${value}`,
    `Path=${path}`, 'HttpOnly', `SameSite=${sameSite}`, `Max-Age=${maxAge}`,
    ...(secure(request) ? ['Secure'] : []),
  ].join('; '));
}

function writeSigned(request, response, name, data, options) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  setCookie(request, response, name, `${payload}.${sign(payload)}`, options);
}

// The cookie's data when its signature is valid and it hasn't expired, else null.
function readSigned(request, name) {
  const [payload, signature] = String(cookies(request)[name] ?? '').split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export function startSession(request, response, user) {
  writeSigned(request, response, COOKIE, {
    uid: user.id,
    v: user.session_version,
    exp: Date.now() + SESSION_DAYS * 864e5,
  }, { maxAge: SESSION_DAYS * 86400 });
}

export function endSession(request, response) {
  setCookie(request, response, COOKIE, '', { maxAge: 0 });
}

// Returns { uid, v } from a valid, unexpired session cookie, or null.
export function readSession(request) {
  return readSigned(request, COOKIE);
}

// key is utils/admin.js's adminKey(); a session made with an older key no longer counts.
export function startAdminSession(request, response, key) {
  writeSigned(request, response, ADMIN_COOKIE, { key, exp: Date.now() + ADMIN_HOURS * 36e5 }, { maxAge: ADMIN_HOURS * 3600, path: ADMIN_PATH, sameSite: 'Strict' });
}

export function endAdminSession(request, response) {
  setCookie(request, response, ADMIN_COOKIE, '', { maxAge: 0, path: ADMIN_PATH, sameSite: 'Strict' });
}

export function hasAdminSession(request, key) {
  return readSigned(request, ADMIN_COOKIE)?.key === key;
}
