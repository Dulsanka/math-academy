'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const USER_STORE = path.join(DATA_DIR, 'users.json');
const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PASSWORD_BYTES = 64;
const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-math_academy_session' : 'math_academy_session';
const WORKBOOKS = {
  arithmetic: { page: '1_interactive_math_workbook.html', script: 'assets/js/interactive-workbook.js' },
  year6: { page: '6_year6_nz_mathematics_workbook.html', script: 'assets/js/year6-workbook.js' },
  year7: { page: '7_year7_nz_mathematics_workbook.html', script: 'assets/js/year7-workbook.js' },
  year8: { page: '2_year8_nz_mathematics_workbook.html', script: 'assets/js/year8-workbook.js' },
  year9: { page: '3_year9_nz_mathematics_workbook.html', script: 'assets/js/year9-workbook.js' },
  year10: { page: '4_year10_nz_mathematics_workbook.html', script: 'assets/js/year10-workbook.js' },
  year11: { page: '5_year11_nz_mathematics_workbook.html', script: 'assets/js/year11-workbook.js' }
};
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon'
};
const sessions = new Map();
const loginAttempts = new Map();
let users = [];

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function saveUsers() {
  const temporaryFile = USER_STORE + '.tmp';
  fs.writeFileSync(temporaryFile, JSON.stringify(users, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, USER_STORE);
}

function validUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9._-]{3,32}$/.test(username);
}

function validPassword(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 256;
}

async function makePassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, PASSWORD_BYTES);
  return { passwordSalt: salt, passwordHash: hash.toString('hex') };
}

async function passwordMatches(password, user) {
  const expected = Buffer.from(user.passwordHash, 'hex');
  const actual = await scrypt(password, user.passwordSalt, PASSWORD_BYTES);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function publicUser(user) {
  return { id: user.id, username: user.username, role: user.role, active: user.active, entitlements: [...user.entitlements] };
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

function getSession(req) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  const user = users.find((item) => item.id === session.userId && item.active);
  return user ? { token, session, user } : null;
}

function setSessionCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16_384) throw new Error('Request is too large.');
  }
  try { return JSON.parse(body || '{}'); }
  catch { throw new Error('Request body must be valid JSON.'); }
}

function attemptKey(req, username) {
  return `${req.socket.remoteAddress || 'unknown'}:${String(username || '').toLowerCase()}`;
}

function ipAttemptKey(req) {
  return `ip:${req.socket.remoteAddress || 'unknown'}`;
}

function currentAttemptState(key) {
  const now = Date.now();
  const state = loginAttempts.get(key);
  if (!state || state.windowEndsAt <= now) return { count: 0, windowEndsAt: now + 15 * 60 * 1000, blockedUntil: 0 };
  return state;
}

function failLogin(key, limit = 5) {
  const state = currentAttemptState(key);
  state.count += 1;
  if (state.count >= limit) state.blockedUntil = Date.now() + 15 * 60 * 1000;
  loginAttempts.set(key, state);
}

function isAllowedEntitlementList(value) {
  return Array.isArray(value) && value.every((entry) => Object.hasOwn(WORKBOOKS, entry));
}

async function serveFile(res, relativePath, cacheControl = 'no-cache') {
  const absolutePath = path.resolve(ROOT, relativePath);
  if (!absolutePath.startsWith(ROOT + path.sep)) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  let stat;
  try { stat = await fs.promises.stat(absolutePath); }
  catch { res.writeHead(404); res.end('Not found'); return; }
  if (!stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(absolutePath).toLowerCase()] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': cacheControl });
  fs.createReadStream(absolutePath).pipe(res);
}

function workbookForPath(urlPath) {
  for (const [key, workbook] of Object.entries(WORKBOOKS)) {
    if (urlPath === `/${workbook.page}` || urlPath === `/${workbook.script}`) return key;
  }
  return null;
}

function resolveStaticPath(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html') return 'index.html';
  if (urlPath === '/assets/css/site.css') return 'assets/css/site.css';
  if (urlPath === '/assets/css/interactive-workbook.css') return 'assets/css/interactive-workbook.css';
  if (urlPath === '/assets/css/curriculum-workbook.css') return 'assets/css/curriculum-workbook.css';
  if (urlPath === '/assets/js/site.js') return 'assets/js/site.js';
  if (urlPath === '/assets/favicon.svg') return 'assets/favicon.svg';
  if (urlPath === '/admin.js') return 'admin.js';
  if (urlPath === '/admin.css') return 'admin.css';
  return null;
}

async function handleApi(req, res, urlPath) {
  if (req.method === 'GET' && urlPath === '/api/auth/me') {
    const auth = getSession(req);
    if (!auth) return sendJson(res, 200, { authenticated: false });
    const entitlements = auth.user.role === 'admin' ? Object.keys(WORKBOOKS) : auth.user.entitlements;
    return sendJson(res, 200, { authenticated: true, user: publicUser(auth.user), allowedWorkbooks: entitlements });
  }

  if (req.method === 'POST' && urlPath === '/api/auth/login') {
    let body;
    try { body = await readJson(req); }
    catch (error) { return sendJson(res, 400, { error: error.message }); }
    const key = attemptKey(req, body.username);
    const state = currentAttemptState(key);
    const ipState = currentAttemptState(ipAttemptKey(req));
    if (state.blockedUntil > Date.now() || ipState.blockedUntil > Date.now()) return sendJson(res, 429, { error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    const username = String(body.username || '').toLowerCase();
    const user = users.find((item) => item.username.toLowerCase() === username && item.active);
    const password = typeof body.password === 'string' ? body.password : '';
    let matched = false;
    if (user) matched = await passwordMatches(password, user);
    else await scrypt(password.slice(0, 256), 'math-academy-login-salt', PASSWORD_BYTES);
    if (!matched) {
      failLogin(key);
      failLogin(ipAttemptKey(req), 30);
      return sendJson(res, 401, { error: 'Username or password is incorrect.' });
    }
    loginAttempts.delete(key);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(token, { userId: user.id, expiresAt });
    setSessionCookie(res, token, SESSION_TTL_MS / 1000);
    return sendJson(res, 200, { authenticated: true, user: publicUser(user), allowedWorkbooks: user.role === 'admin' ? Object.keys(WORKBOOKS) : user.entitlements });
  }

  if (req.method === 'POST' && urlPath === '/api/auth/logout') {
    const auth = getSession(req);
    if (auth) sessions.delete(auth.token);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  }

  if (urlPath.startsWith('/api/admin/')) {
    const auth = getSession(req);
    if (!auth || auth.user.role !== 'admin') return sendJson(res, 403, { error: 'Administrator access required.' });

    if (req.method === 'GET' && urlPath === '/api/admin/users') {
      return sendJson(res, 200, { users: users.map(publicUser) });
    }

    if (req.method === 'POST' && urlPath === '/api/admin/users') {
      let body;
      try { body = await readJson(req); }
      catch (error) { return sendJson(res, 400, { error: error.message }); }
      const username = String(body.username || '').trim();
      if (!validUsername(username)) return sendJson(res, 400, { error: 'Username must be 3–32 characters using letters, numbers, dots, underscores or hyphens.' });
      if (!validPassword(body.password)) return sendJson(res, 400, { error: 'Password must be at least 12 characters.' });
      if (users.some((item) => item.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username already exists.' });
      if (!isAllowedEntitlementList(body.entitlements || [])) return sendJson(res, 400, { error: 'One or more workbook entitlements are invalid.' });
      const passwordFields = await makePassword(body.password);
      const created = { id: crypto.randomUUID(), username, role: 'student', active: true, entitlements: [...new Set(body.entitlements || [])], ...passwordFields, createdAt: new Date().toISOString() };
      users.push(created); saveUsers();
      return sendJson(res, 201, { user: publicUser(created) });
    }

    const match = urlPath.match(/^\/api\/admin\/users\/([0-9a-f-]+)$/i);
    if (req.method === 'PATCH' && match) {
      let body;
      try { body = await readJson(req); }
      catch (error) { return sendJson(res, 400, { error: error.message }); }
      const target = users.find((item) => item.id === match[1]);
      if (!target) return sendJson(res, 404, { error: 'User not found.' });
      if (body.username !== undefined) {
        const username = String(body.username).trim();
        if (!validUsername(username)) return sendJson(res, 400, { error: 'Username must be 3–32 valid characters.' });
        if (users.some((item) => item.id !== target.id && item.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username already exists.' });
      }
      if (body.entitlements !== undefined && !isAllowedEntitlementList(body.entitlements)) return sendJson(res, 400, { error: 'One or more workbook entitlements are invalid.' });
      if (body.active !== undefined && typeof body.active !== 'boolean') return sendJson(res, 400, { error: 'Active must be true or false.' });
      if (body.active === false && target.role === 'admin' && users.filter((item) => item.role === 'admin' && item.active).length < 2) return sendJson(res, 400, { error: 'Keep at least one active administrator.' });
      if (body.username !== undefined) target.username = String(body.username).trim();
      if (body.entitlements !== undefined) target.entitlements = [...new Set(body.entitlements)];
      if (body.active !== undefined) {
        target.active = body.active;
        if (!target.active) for (const [token, session] of sessions) if (session.userId === target.id) sessions.delete(token);
      }
      saveUsers();
      return sendJson(res, 200, { user: publicUser(target) });
    }

    const passwordMatch = urlPath.match(/^\/api\/admin\/users\/([0-9a-f-]+)\/password$/i);
    if (req.method === 'POST' && passwordMatch) {
      let body;
      try { body = await readJson(req); }
      catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!validPassword(body.password)) return sendJson(res, 400, { error: 'Password must be at least 12 characters.' });
      const target = users.find((item) => item.id === passwordMatch[1]);
      if (!target) return sendJson(res, 404, { error: 'User not found.' });
      Object.assign(target, await makePassword(body.password));
      for (const [token, session] of sessions) if (session.userId === target.id) sessions.delete(token);
      saveUsers();
      return sendJson(res, 200, { ok: true });
    }
    return sendJson(res, 404, { error: 'Admin endpoint not found.' });
  }

  return sendJson(res, 404, { error: 'API endpoint not found.' });
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  try { users = JSON.parse(fs.readFileSync(USER_STORE, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    users = [];
    saveUsers();
  }
  if (!Array.isArray(users)) throw new Error('User store is invalid.');

  const bootstrapUsername = process.env.BOOTSTRAP_ADMIN_USERNAME;
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (bootstrapUsername && bootstrapPassword && !users.some((user) => user.role === 'admin')) {
    if (!validUsername(bootstrapUsername) || !validPassword(bootstrapPassword)) throw new Error('Bootstrap admin requires a valid username and a password of at least 12 characters.');
    if (users.some((user) => user.username.toLowerCase() === bootstrapUsername.toLowerCase())) throw new Error('The bootstrap administrator username already belongs to another account. Choose a different username.');
    const passwordFields = await makePassword(bootstrapPassword);
    users.push({ id: crypto.randomUUID(), username: bootstrapUsername, role: 'admin', active: true, entitlements: Object.keys(WORKBOOKS), ...passwordFields, createdAt: new Date().toISOString() });
    saveUsers();
    console.log(`Created initial administrator account: ${bootstrapUsername}`);
  }
  if (!users.some((user) => user.role === 'admin' && user.active)) console.warn('No active administrator account exists. Set BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD, then restart the server.');

  const server = http.createServer(async (req, res) => {
    setSecurityHeaders(res);
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const urlPath = requestUrl.pathname;

    if (urlPath.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
      try { await handleApi(req, res, urlPath); }
      catch (error) { console.error('API error:', error); if (!res.headersSent) sendJson(res, 500, { error: 'The request could not be completed.' }); }
      return;
    }

    const auth = getSession(req);
    if (urlPath === '/admin.html' || urlPath === '/admin.js' || urlPath === '/admin.css') {
      if (!auth || auth.user.role !== 'admin') { res.writeHead(auth ? 403 : 401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(auth ? 'Administrator access required.' : 'Please sign in as an administrator.'); return; }
      const file = urlPath === '/admin.html' ? 'admin.html' : resolveStaticPath(urlPath);
      return serveFile(res, file, 'no-store');
    }

    const workbookKey = workbookForPath(urlPath);
    if (workbookKey) {
      const allowed = auth && (auth.user.role === 'admin' || auth.user.entitlements.includes(workbookKey));
      if (!allowed) { res.writeHead(auth ? 403 : 401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(auth ? 'This account does not have access to this workbook.' : 'Sign in is required.'); return; }
      const workbook = WORKBOOKS[workbookKey];
      const file = urlPath.endsWith('.html') ? workbook.page : workbook.script;
      return serveFile(res, file, 'private, no-store');
    }

    const staticPath = resolveStaticPath(urlPath);
    if (staticPath) return serveFile(res, staticPath, 'public, max-age=300');
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  server.listen(PORT, '0.0.0.0', () => console.log(`Math Academy access server listening on port ${PORT}`));
}

main().catch((error) => { console.error(error.message); process.exit(1); });
