import * as User from '../models/user.model.js';
import { adminKey } from '../utils/admin.js';
import { HttpError } from '../utils/HttpError.js';
import { hasAdminSession, readSession } from '../utils/session.js';

// The signed-in reader from the session cookie, or null. A session issued before a
// password reset (older session_version) no longer counts.
async function sessionUser(request) {
  const session = readSession(request);
  if (!session) return null;
  const user = await User.findById(session.uid);
  return user && user.session_version === session.v ? user : null;
}

// Puts the reader (or null when signed out) on request.user.
export async function loadUser(request, response, next) {
  request.user = await sessionUser(request);
  next();
}

// Same, but answers 401 when nobody is signed in.
export async function requireUser(request, response, next) {
  request.user = await sessionUser(request);
  if (!request.user) throw new HttpError(401, 'Sign in to continue.');
  next();
}

// The admin panel's routes answer 401 until the admin signs in (POST /api/admin/login).
export function requireAdmin(request, response, next) {
  if (!hasAdminSession(request, adminKey())) throw new HttpError(401, 'Sign in as the admin to continue.');
  next();
}
