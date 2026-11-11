const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Cloudflare Workers supports up to 100,000 PBKDF2 iterations per operation.
const PASSWORD_ITERATIONS = 100_000;
const SESSION_COOKIE = '__Host-math_academy_session';

const WORKBOOKS = {
  arithmetic: { page: '/1_interactive_math_workbook.html', script: '/assets/js/interactive-workbook.js' },
  year6: { page: '/6_year6_nz_mathematics_workbook.html', script: '/assets/js/year6-workbook.js' },
  year7: { page: '/7_year7_nz_mathematics_workbook.html', script: '/assets/js/year7-workbook.js' },
  year8: { page: '/2_year8_nz_mathematics_workbook.html', script: '/assets/js/year8-workbook.js' },
  year9: { page: '/3_year9_nz_mathematics_workbook.html', script: '/assets/js/year9-workbook.js' },
  year10: { page: '/4_year10_nz_mathematics_workbook.html', script: '/assets/js/year10-workbook.js' },
  year11: { page: '/5_year11_nz_mathematics_workbook.html', script: '/assets/js/year11-workbook.js' }
};

const PUBLIC_ASSETS = new Set([
  '/', '/index.html', '/assets/css/site.css', '/assets/css/interactive-workbook.css',
  '/assets/css/curriculum-workbook.css', '/assets/js/site.js', '/assets/favicon.svg'
]);

let bootstrapPromise;

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}

function text(message, status, headers = {}) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

function secure(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function sessionCookie(token, maxAge) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function validUsername(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]{3,32}$/.test(value);
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && value.length <= 256;
}

function publicUser(row) {
  let entitlements = [];
  try { entitlements = JSON.parse(row.entitlements || '[]'); } catch { /* Keep malformed data private. */ }
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    active: Boolean(row.active),
    entitlements
  };
}

function userEntitlements(user) {
  return user.role === 'admin' ? Object.keys(WORKBOOKS) : user.entitlements;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return new Uint8Array();
  return Uint8Array.from(hex.match(/.{2}/g) || [], (value) => parseInt(value, 16));
}

function randomHex(byteCount) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function digestHex(value) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}

async function derivePassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: PASSWORD_ITERATIONS }, key, 256);
  return bytesToHex(new Uint8Array(bits));
}

function equalHex(left, right) {
  const a = hexToBytes(left);
  const b = hexToBytes(right);
  if (a.length !== b.length || a.length === 0) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function cookieValue(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator >= 0 && part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

async function readJson(request) {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().includes('application/json')) throw new Error('Request must use JSON.');
  const body = await request.text();
  if (body.length > 16_384) throw new Error('Request is too large.');
  try { return JSON.parse(body || '{}'); }
  catch { throw new Error('Request body must be valid JSON.'); }
}

async function getAuth(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/i.test(token)) return null;
  const tokenHash = await digestHex(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.role, u.active, u.entitlements
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`
  ).bind(tokenHash, Date.now()).first();
  return row ? { tokenHash, user: publicUser(row) } : null;
}

async function ensureBootstrapAdmin(env) {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    if (!env.BOOTSTRAP_ADMIN_USERNAME || !env.BOOTSTRAP_ADMIN_PASSWORD) return;
    const existing = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first();
    if (existing) return;
    const username = env.BOOTSTRAP_ADMIN_USERNAME.trim();
    if (!validUsername(username) || !validPassword(env.BOOTSTRAP_ADMIN_PASSWORD)) {
      throw new Error('Bootstrap admin requires a valid username and a password of at least 12 characters.');
    }
    const usernameCollision = await env.DB.prepare('SELECT id FROM users WHERE username_key = lower(?) LIMIT 1').bind(username).first();
    if (usernameCollision) throw new Error('The bootstrap administrator username already belongs to another account. Choose a different username.');
    const salt = randomHex(16);
    const passwordHash = await derivePassword(env.BOOTSTRAP_ADMIN_PASSWORD, salt);
    const now = Date.now();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, username, username_key, role, active, entitlements, password_salt, password_hash, created_at)
       SELECT ?, ?, lower(?), 'admin', 1, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')`
    ).bind(crypto.randomUUID(), username, username, JSON.stringify(Object.keys(WORKBOOKS)), salt, passwordHash, now).run();
  })().catch((error) => {
    bootstrapPromise = undefined;
    throw error;
  });
  return bootstrapPromise;
}

function allowedEntitlementList(value) {
  return Array.isArray(value) && value.every((entry) => Object.hasOwn(WORKBOOKS, entry));
}

async function attemptState(env, key, now) {
  return await env.DB.prepare('SELECT attempt_count, window_ends_at, blocked_until FROM login_attempts WHERE attempt_key = ?')
    .bind(key).first() || { attempt_count: 0, window_ends_at: now + LOGIN_WINDOW_MS, blocked_until: 0 };
}

async function failLogin(env, key, limit, now) {
  const state = await attemptState(env, key, now);
  const inWindow = state.window_ends_at > now;
  const count = inWindow ? state.attempt_count + 1 : 1;
  const windowEndsAt = inWindow ? state.window_ends_at : now + LOGIN_WINDOW_MS;
  const blockedUntil = count >= limit ? now + LOGIN_WINDOW_MS : (inWindow ? state.blocked_until : 0);
  await env.DB.prepare(
    `INSERT INTO login_attempts (attempt_key, attempt_count, window_ends_at, blocked_until)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(attempt_key) DO UPDATE SET attempt_count = excluded.attempt_count,
       window_ends_at = excluded.window_ends_at, blocked_until = excluded.blocked_until`
  ).bind(key, count, windowEndsAt, blockedUntil).run();
}

async function handleApi(request, env, url) {
  const { pathname } = url;
  const now = Date.now();

  if (pathname === '/api/auth/me' && request.method === 'GET') {
    const auth = await getAuth(request, env);
    return json(auth
      ? { authenticated: true, user: auth.user, allowedWorkbooks: userEntitlements(auth.user) }
      : { authenticated: false });
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const usernameInput = String(body.username || '').trim();
    const usernameKey = usernameInput.toLowerCase().slice(0, 64);
    const address = (request.headers.get('CF-Connecting-IP') || 'unknown').slice(0, 80);
    const usernameAttemptKey = `username:${address}:${usernameKey}`;
    const ipAttemptKey = `ip:${address}`;
    const usernameState = await attemptState(env, usernameAttemptKey, now);
    const ipState = await attemptState(env, ipAttemptKey, now);
    if (usernameState.blocked_until > now || ipState.blocked_until > now) {
      return json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, 429);
    }

    const userRow = await env.DB.prepare('SELECT * FROM users WHERE username_key = ? AND active = 1').bind(usernameKey).first();
    const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
    const salt = userRow ? userRow.password_salt : '6d6174682d61636164656d792d6c6f67696e2d73616c74';
    const actualHash = await derivePassword(password, salt);
    const matched = Boolean(userRow && equalHex(actualHash, userRow.password_hash));
    if (!matched) {
      await Promise.all([failLogin(env, usernameAttemptKey, 5, now), failLogin(env, ipAttemptKey, 30, now)]);
      await env.DB.prepare('DELETE FROM login_attempts WHERE window_ends_at < ?').bind(now - 24 * 60 * 60 * 1000).run();
      return json({ error: 'Username or password is incorrect.' }, 401);
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM login_attempts WHERE attempt_key IN (?, ?)').bind(usernameAttemptKey, ipAttemptKey),
      env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now)
    ]);
    const token = randomHex(32);
    const tokenHash = await digestHex(token);
    const expiresAt = now + SESSION_TTL_MS;
    await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .bind(tokenHash, userRow.id, expiresAt, now).run();
    const user = publicUser(userRow);
    return json({ authenticated: true, user, allowedWorkbooks: userEntitlements(user) }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_TTL_MS / 1000) });
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    const auth = await getAuth(request, env);
    if (auth) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(auth.tokenHash).run();
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  if (!pathname.startsWith('/api/admin/')) return json({ error: 'API endpoint not found.' }, 404);
  const auth = await getAuth(request, env);
  if (!auth || auth.user.role !== 'admin') return json({ error: 'Administrator access required.' }, 403);

  if (pathname === '/api/admin/users' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id, username, role, active, entitlements FROM users ORDER BY username_key').all();
    return json({ users: (result.results || []).map(publicUser) });
  }

  if (pathname === '/api/admin/users' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const username = String(body.username || '').trim();
    const entitlements = body.entitlements || [];
    if (!validUsername(username)) return json({ error: 'Username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.' }, 400);
    if (!validPassword(body.password)) return json({ error: 'Password must be at least 12 characters.' }, 400);
    if (!allowedEntitlementList(entitlements)) return json({ error: 'One or more workbook entitlements are invalid.' }, 400);
    const salt = randomHex(16);
    const passwordHash = await derivePassword(body.password, salt);
    const id = crypto.randomUUID();
    try {
      await env.DB.prepare(
        `INSERT INTO users (id, username, username_key, role, active, entitlements, password_salt, password_hash, created_at)
         VALUES (?, ?, lower(?), 'student', 1, ?, ?, ?, ?)`
      ).bind(id, username, username, JSON.stringify([...new Set(entitlements)]), salt, passwordHash, now).run();
    } catch (error) {
      if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'That username already exists.' }, 409);
      throw error;
    }
    const created = await env.DB.prepare('SELECT id, username, role, active, entitlements FROM users WHERE id = ?').bind(id).first();
    return json({ user: publicUser(created) }, 201);
  }

  const passwordMatch = pathname.match(/^\/api\/admin\/users\/([0-9a-f-]+)\/password$/i);
  if (passwordMatch && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!validPassword(body.password)) return json({ error: 'Password must be at least 12 characters.' }, 400);
    const target = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(passwordMatch[1]).first();
    if (!target) return json({ error: 'User not found.' }, 404);
    const salt = randomHex(16);
    const passwordHash = await derivePassword(body.password, salt);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?').bind(salt, passwordHash, target.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id)
    ]);
    return json({ ok: true });
  }

  const userMatch = pathname.match(/^\/api\/admin\/users\/([0-9a-f-]+)$/i);
  if (userMatch && request.method === 'PATCH') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const target = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userMatch[1]).first();
    if (!target) return json({ error: 'User not found.' }, 404);
    let username = target.username;
    let entitlements;
    let active = Boolean(target.active);
    if (body.username !== undefined) {
      username = String(body.username).trim();
      if (!validUsername(username)) return json({ error: 'Username must be 3-32 valid characters.' }, 400);
    }
    if (body.entitlements !== undefined) {
      if (!allowedEntitlementList(body.entitlements)) return json({ error: 'One or more workbook entitlements are invalid.' }, 400);
      entitlements = [...new Set(body.entitlements)];
    } else entitlements = JSON.parse(target.entitlements || '[]');
    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') return json({ error: 'Active must be true or false.' }, 400);
      active = body.active;
    }
    if (!active && target.role === 'admin') {
      const admins = await env.DB.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND active = 1").first();
      if (admins.count < 2) return json({ error: 'Keep at least one active administrator.' }, 400);
    }
    try {
      await env.DB.prepare('UPDATE users SET username = ?, username_key = lower(?), entitlements = ?, active = ? WHERE id = ?')
        .bind(username, username, JSON.stringify(entitlements), active ? 1 : 0, target.id).run();
    } catch (error) {
      if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'That username already exists.' }, 409);
      throw error;
    }
    if (!active) await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
    const updated = await env.DB.prepare('SELECT id, username, role, active, entitlements FROM users WHERE id = ?').bind(target.id).first();
    return json({ user: publicUser(updated) });
  }

  return json({ error: 'Admin endpoint not found.' }, 404);
}

function workbookForPath(pathname) {
  for (const [key, workbook] of Object.entries(WORKBOOKS)) {
    if (pathname === workbook.page || pathname === workbook.script) return key;
  }
  return null;
}

async function serveAsset(request, env, cacheControl) {
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);
  return secure(new Response(response.body, { status: response.status, statusText: response.statusText, headers }));
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.startsWith('/api/')) {
    if (!['GET', 'POST', 'PATCH'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, PATCH' });
    if (request.method !== 'GET' && request.headers.get('Origin') !== url.origin) return json({ error: 'Request origin is not allowed.' }, 403);
    try {
      await ensureBootstrapAdmin(env);
      return secure(await handleApi(request, env, url));
    }
    catch (error) {
      console.error('API error:', error);
      return secure(json({ error: 'The request could not be completed.' }, 500));
    }
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return secure(text('Method not allowed.', 405, { Allow: 'GET, HEAD' }));
  const auth = await getAuth(request, env);

  if (path === '/admin.html' || path === '/admin.js' || path === '/admin.css') {
    if (!auth || auth.user.role !== 'admin') return secure(text(auth ? 'Administrator access required.' : 'Please sign in as an administrator.', auth ? 403 : 401));
    return serveAsset(request, env, 'private, no-store');
  }

  const workbookKey = workbookForPath(path);
  if (workbookKey) {
    const allowed = auth && (auth.user.role === 'admin' || auth.user.entitlements.includes(workbookKey));
    if (!allowed) return secure(text(auth ? 'This account does not have access to this workbook.' : 'Sign in is required.', auth ? 403 : 401));
    return serveAsset(request, env, 'private, no-store');
  }

  if (PUBLIC_ASSETS.has(path)) return serveAsset(request, env, 'public, max-age=300');
  return secure(text('Not found.', 404));
}

export default {
  async fetch(request, env) {
    try { return await handleRequest(request, env); }
    catch (error) {
      console.error('Request error:', error);
      if (new URL(request.url).pathname.startsWith('/api/')) return secure(json({ error: 'The request could not be completed.' }, 500));
      return secure(text('The request could not be completed.', 500));
    }
  }
};
