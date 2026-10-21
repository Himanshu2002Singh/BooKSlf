// HTTP tests against the real Express app. The "with database" suite runs only when
// DATABASE_URL is set (backend/.env) and uses throwaway accounts it deletes afterwards.
import assert from 'node:assert/strict';
import { after, before, describe, mock, test } from 'node:test';
import app from '../app.js';
import { closeDb, query } from '../db/pool.js';

const ADMIN = { ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'test-admin-password' };

// Runs fn with these environment variables set (undefined deletes one), then puts them back.
async function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map(name => [name, process.env[name]]));
  const apply = values => Object.entries(values).forEach(([name, value]) => (value === undefined ? delete process.env[name] : (process.env[name] = value)));
  apply(vars);
  try {
    return await fn();
  } finally {
    apply(saved);
  }
}

let server;
let base;

before(async () => {
  process.env.SESSION_SECRET ||= 'test-secret-that-is-long-enough-for-hmac-signing';
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await closeDb();
});

function call(path, { method = 'GET', body, cookie, type = 'application/json' } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': type } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  }).then(async response => ({ status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] }));
}

describe('without a database', () => {
  test('signed-out /me answers user: null', async () => {
    assert.deepEqual(await call('/me'), { status: 200, body: { user: null }, cookie: undefined });
  });

  test('changes must be JSON (blocks cross-site form posts)', async () => {
    const result = await call('/auth/logout', { method: 'POST', body: 'x=1', type: 'application/x-www-form-urlencoded' });
    assert.equal(result.status, 415);
  });

  test('unknown API paths are a JSON 404', async () => {
    assert.equal((await call('/nope')).status, 404);
  });

  test('protected routes need a session', async () => {
    assert.equal((await call('/me/shelf', { method: 'PUT', body: { books: [] } })).status, 401);
    assert.equal((await call('/books/search?q=dune')).status, 401);
    assert.equal((await call('/books/scan', { method: 'POST', body: { photo: '/9j/AAAA' } })).status, 401);
  });

  test('bad sign-up input is rejected before touching the database', async () => {
    assert.equal((await call('/auth/signup', { method: 'POST', body: { email: 'nope', password: 'longenough' } })).status, 400);
    assert.equal((await call('/auth/signup', { method: 'POST', body: { email: 'a@b.co', password: 'short' } })).status, 400);
  });

  test('Goodreads syncing and reviews need a signed-in reader', async () => {
    assert.equal((await call('/goodreads', { method: 'PUT', body: { profile: '123' } })).status, 401);
    assert.equal((await call('/goodreads/sync', { method: 'POST', body: {} })).status, 401);
    assert.equal((await call('/me/review', { method: 'PUT', body: { rating: 5 } })).status, 401);
  });

  test('landing messages are checked before touching the database', async () => {
    assert.equal((await call('/messages', { method: 'POST', body: { kind: 'question', text: 'Is it free?' } })).status, 400);
    assert.equal((await call('/messages', { method: 'POST', body: { kind: 'other', text: 'x' } })).status, 400);
  });

  test('the admin panel needs its own sign-in, and is off until it is configured', async () => {
    await withEnv(ADMIN, async () => {
      assert.equal((await call('/admin/overview')).status, 401);
      assert.equal((await call('/admin/login', { method: 'POST', body: { email: ADMIN.ADMIN_EMAIL, password: 'not-the-password' } })).status, 401);
      const login = await call('/admin/login', { method: 'POST', body: { email: ADMIN.ADMIN_EMAIL, password: ADMIN.ADMIN_PASSWORD } });
      assert.equal(login.status, 200);
      assert.match(login.cookie, /^bs_admin=/);
    });
    await withEnv({ ADMIN_PASSWORD: undefined }, async () => {
      assert.equal((await call('/admin/overview')).status, 503);
    });
  });
});

describe('with database', { skip: !process.env.DATABASE_URL && 'DATABASE_URL not set' }, () => {
  const stamp = `${process.pid}${Math.floor(performance.now())}`;
  const email = `test-${stamp}@example.com`;
  const username = `test-${stamp}`;
  let cookie;

  after(async () => {
    await query('DELETE FROM users WHERE email LIKE ?', [`test-${stamp}%`]);
    await query('DELETE FROM messages WHERE body LIKE ?', [`test-${stamp}%`]);
  });

  test('sign up signs the reader in with an empty shelf', async () => {
    const result = await call('/auth/signup', { method: 'POST', body: { email, password: 'first-password', name: 'Test Reader' } });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.email, email);
    assert.equal(result.body.user.hasPassword, true);
    assert.deepEqual(result.body.shelf, { books: [], themeId: 'light-grid', purchasedThemeIds: [] });
    cookie = result.cookie;
    assert.equal((await call('/me', { cookie })).body.user.email, email);
  });

  test('the same email cannot sign up twice', async () => {
    assert.equal((await call('/auth/signup', { method: 'POST', body: { email, password: 'other-password' } })).status, 409);
  });

  test('the shelf saves and comes back cleaned', async () => {
    const books = [{ id: 'b1', title: 'Dune', author: 'Frank Herbert', cover: 'https://example.com/d.jpg', rating: 5 }];
    const saved = await call('/me/shelf', { method: 'PUT', cookie, body: { books, themeId: 'macos', purchasedThemeIds: ['macos'] } });
    assert.equal(saved.status, 200);
    assert.deepEqual((await call('/me', { cookie })).body.shelf, { books, themeId: 'macos', purchasedThemeIds: ['macos'] });
  });

  test('Goodreads: connecting adds the books; syncs add only new ones and removed books stay removed', async () => {
    const shelves = { read: [['1', 'Dune', 'Frank Herbert'], ['2', 'Emma', 'Jane Austen']], 'currently-reading': [['3', 'Ulysses', 'James Joyce']] };
    const rss = books => `<rss><channel>${books.map(([id, title, author]) => `<item><title>${title}</title><book_id>${id}</book_id><author_name>${author}</author_name><user_rating>0</user_rating></item>`).join('')}</channel></rss>`;
    const realFetch = globalThis.fetch;
    let goodreadsReads = 0;
    const fetchMock = mock.method(globalThis, 'fetch', (url, options) => {
      const shelf = String(url).match(/goodreads\.com\/review\/list_rss\/123\?shelf=([\w-]+)/)?.[1];
      if (!shelf) return realFetch(url, options);
      goodreadsReads += 1;
      return Promise.resolve(new Response(rss(shelves[shelf])));
    });
    try {
      const connected = await call('/goodreads', { method: 'PUT', cookie, body: { profile: 'https://www.goodreads.com/user/show/123-reader' } });
      assert.equal(connected.status, 200);
      assert.equal(connected.body.found, 3);
      assert.deepEqual(connected.body.added.map(book => book.id), ['gr-2', 'gr-3'], 'Dune was already on the shelf');
      const me = (await call('/me', { cookie })).body;
      assert.equal(me.goodreads.profileUrl, 'https://www.goodreads.com/user/show/123');

      // The reader removes Emma here, and adds a new book on Goodreads.
      await call('/me/shelf', { method: 'PUT', cookie, body: { ...me.shelf, books: me.shelf.books.filter(book => book.id !== 'gr-2') } });
      shelves.read.push(['4', 'Beloved', 'Toni Morrison']);
      const reads = goodreadsReads;
      assert.deepEqual((await call('/goodreads/sync', { method: 'POST', cookie, body: {} })).body.added, []);
      assert.equal(goodreadsReads, reads, 'an automatic sync just after a read skips Goodreads');
      const synced = await call('/goodreads/sync', { method: 'POST', cookie, body: { force: true } });
      assert.deepEqual(synced.body.added.map(book => book.id), ['gr-4']);
      assert.deepEqual((await call('/me', { cookie })).body.shelf.books.map(book => book.id), ['b1', 'gr-3', 'gr-4']);
    } finally {
      fetchMock.mock.restore();
    }
  });

  test('a review is checked, saved, replaced and comes back with the account', async () => {
    assert.equal((await call('/me', { cookie })).body.review, null);
    assert.equal((await call('/me/review', { method: 'PUT', cookie, body: { rating: 0 } })).status, 400);
    await call('/me/review', { method: 'PUT', cookie, body: { rating: 4, text: 'Nice' } });
    const saved = await call('/me/review', { method: 'PUT', cookie, body: { rating: 5, text: 'Lovely shelves' } });
    assert.deepEqual(saved.body.review, { rating: 5, text: 'Lovely shelves' });
    assert.deepEqual((await call('/me', { cookie })).body.review, { rating: 5, text: 'Lovely shelves' });
  });

  test('admin: readers, landing messages, and prices that checkout then charges', async () => {
    const { macos } = (await call('/themes/prices')).body.prices;
    // No Razorpay keys, so checkout makes a simulated order and never calls Razorpay.
    await withEnv({ ...ADMIN, RAZORPAY_KEY_ID: undefined, RAZORPAY_KEY_SECRET: undefined }, async () => {
      const admin = (await call('/admin/login', { method: 'POST', body: { email: ADMIN.ADMIN_EMAIL, password: ADMIN.ADMIN_PASSWORD } })).cookie;
      assert.equal((await call('/admin/overview', { cookie })).status, 401, 'a reader session is not enough');

      assert.equal((await call('/messages', { method: 'POST', body: { kind: 'question', text: `test-${stamp} Is it free?`, email } })).status, 200);
      await call('/messages', { method: 'POST', body: { kind: 'updates', text: `test-${stamp} bot`, website: 'spam.example' } });
      const sent = (await call('/admin/messages', { cookie: admin })).body.messages.filter(message => message.text.startsWith(`test-${stamp}`));
      assert.deepEqual(sent.map(message => [message.kind, message.email]), [['question', email]], 'the bot’s message is dropped');
      await call(`/admin/messages/${sent[0].id}`, { method: 'DELETE', cookie: admin, body: {} });
      assert.equal((await call('/admin/messages', { cookie: admin })).body.messages.some(message => message.id === sent[0].id), false);

      const found = (await call(`/admin/readers?q=${encodeURIComponent(email)}`, { cookie: admin })).body;
      assert.equal(found.total, 1);
      assert.deepEqual(
        { themeId: found.readers[0].themeId, books: found.readers[0].books, rating: found.readers[0].rating, signIn: found.readers[0].signIn },
        { themeId: 'macos', books: 3, rating: 5, signIn: ['password'] },
      );
      const overview = (await call('/admin/overview', { cookie: admin })).body;
      assert.ok(overview.counts.readers >= 1 && overview.usage.macos.readers >= 1 && overview.usage.macos.buyers >= 1);

      try {
        assert.equal((await call('/admin/themes/macos', { method: 'PUT', cookie: admin, body: { inr: '999', usd: 12 } })).status, 400);
        assert.equal((await call('/admin/themes/light-grid', { method: 'PUT', cookie: admin, body: { inr: 99, usd: 2 } })).status, 404);
        assert.deepEqual((await call('/admin/themes/macos', { method: 'PUT', cookie: admin, body: { inr: 999, usd: 12 } })).body.prices.macos, { inr: 999, usd: 12 });
        assert.deepEqual((await call('/themes/prices')).body.prices.macos, { inr: 999, usd: 12 });
        const order = await call('/payments/order', { method: 'POST', cookie, body: { themeId: 'macos' } });
        assert.equal(order.body.amount, 117882, '₹999 + 18% GST');
        const otherLook = await call('/payments/verify', { method: 'POST', cookie, body: { orderId: order.body.orderId, paymentId: 'pay_test', themeId: 'spine-shelf' } });
        assert.equal(otherLook.status, 400, 'an order unlocks only the look it was priced for');
      } finally {
        await query('UPDATE theme_prices SET inr = ?, usd = ? WHERE theme_id = ?', [macos.inr, macos.usd, 'macos']);
      }
    });
  });

  test('a username is checked, claimed and then serves the public shelf', async () => {
    assert.equal((await call(`/usernames/${username}`)).body.available, true);
    assert.equal((await call('/usernames/themes')).body.available, false);
    const claimed = await call('/me/username', { method: 'PUT', cookie, body: { username: username.toUpperCase() } });
    assert.equal(claimed.body.user.username, username);
    assert.equal((await call(`/usernames/${username}`)).body.available, false);

    const shelf = await call(`/shelves/${username}`);
    assert.equal(shelf.status, 200);
    assert.equal(shelf.body.owner.name, 'Test Reader');
    assert.equal(shelf.body.shelf.books[0].title, 'Dune');
    assert.equal(shelf.body.owner.email, undefined);
    assert.equal((await call('/shelves/nobody-lives-here-xyz')).status, 404);
  });

  test('login checks the password and locks after repeated failures', async () => {
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'first-password' } })).status, 200);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } })).status, 401);
    }
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'first-password' } })).status, 429);
  });

  test('password reset uses a one-time link and signs out old sessions', async () => {
    const logged = [];
    const original = console.info;
    console.info = message => logged.push(String(message));
    try {
      assert.deepEqual((await call('/auth/forgot', { method: 'POST', body: { email } })).body, { ok: true });
      assert.deepEqual((await call('/auth/forgot', { method: 'POST', body: { email: `nobody-${stamp}@example.com` } })).body, { ok: true });
    } finally {
      console.info = original;
    }
    const token = decodeURIComponent(logged.join('\n').match(/token=([^\s]+)/)[1]);

    const reset = await call('/auth/reset', { method: 'POST', body: { token, password: 'second-password' } });
    assert.equal(reset.status, 200);
    assert.equal((await call('/me', { cookie })).body.user, null, 'old session should be signed out');
    assert.equal((await call('/me', { cookie: reset.cookie })).body.user.email, email);
    assert.equal((await call('/auth/reset', { method: 'POST', body: { token, password: 'third-password' } })).status, 400, 'link is single-use');
    assert.equal((await call('/auth/login', { method: 'POST', body: { email, password: 'second-password' } })).status, 200, 'reset also clears the lock');
  });
});
