'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const USER_STORE = path.join(DATA_DIR, 'users.json');
const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const PASSWORD_BYTES = 64;
const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-math_academy_session' : 'math_academy_session';
const ADMIN_FILES = new Set(['/admin.html', '/admin.js', '/admin.css']);
const ACCOUNT_FILES = new Map([['/account.html', 'account.html'], ['/account.js', 'assets/js/account.js']]);
const PARENT_FILES = new Map([['/parent.html', 'parent.html'], ['/parent.js', 'assets/js/parent.js']]);
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon'
};
const sessions = new Map();
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPT_KEYS = 10_000;
let users = [];
let WORKBOOKS;
let accountSupport;

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none'");
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
  return { id: user.id, username: user.username, role: user.role, accountType: user.role === 'admin' ? 'admin' : (user.accountType || 'learner'), active: user.active, entitlements: [...user.entitlements] };
}

function adminUser(user) {
  return {
    ...publicUser(user), approvalStatus: user.approvalStatus || 'approved', firstName: user.firstName || '', surname: user.surname || '',
    email: user.email || '', dateOfBirth: user.dateOfBirth || '', address: user.address || '', schoolYear: user.schoolYear || '',
    requestedEntitlements: user.requestedEntitlements || [], accessRequestStatus: user.accessRequestStatus || 'none', parentName: user.parentName || '', parentEmail: user.parentEmail || '', createdAt: user.createdAt
  };
}

function accountProfile(user) {
  return { id: user.id, username: user.username, role: user.role, accountType: user.role === 'admin' ? 'admin' : (user.accountType || 'learner'), firstName: user.firstName || '', surname: user.surname || '', email: user.email || '',
    dateOfBirth: user.dateOfBirth || '', address: user.address || '', schoolYear: user.schoolYear || '', parentName: user.parentName || '', parentEmail: user.parentEmail || '' };
}

function parentChild(user) {
  return { id: user.id, username: user.username, firstName: user.firstName || '', surname: user.surname || '', dateOfBirth: user.dateOfBirth || '',
    schoolYear: user.schoolYear || '', approvalStatus: user.approvalStatus || 'approved', accessRequestStatus: user.accessRequestStatus || 'none', enabled: user.parentEnabled !== false,
    entitlements: [...(user.entitlements || [])], requestedEntitlements: [...(user.requestedEntitlements || [])] };
}

function localEmailEnv() { return { RESEND_API_KEY: process.env.RESEND_API_KEY, RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL }; }

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
  const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new Error('Request must use JSON.');
  const declaredLength = Number(req.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > 16_384) throw new Error('Request is too large.');
  const chunks = [];
  let bytes = 0;
  let tooLarge = false;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 16_384) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) throw new Error('Request is too large.');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new Error('Request body must be valid JSON.'); }
}

function attemptKey(req, username) {
  return `${req.socket.remoteAddress || 'unknown'}:${String(username || '').trim().toLowerCase().slice(0, 64)}`;
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

function pruneLoginAttempts(now = Date.now()) {
  for (const [key, state] of loginAttempts) {
    if (state.windowEndsAt <= now && state.blockedUntil <= now) loginAttempts.delete(key);
  }
  while (loginAttempts.size > MAX_LOGIN_ATTEMPT_KEYS) {
    const oldestKey = loginAttempts.keys().next().value;
    if (oldestKey === undefined) break;
    loginAttempts.delete(oldestKey);
  }
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
  const absolutePath = path.resolve(PUBLIC_DIR, relativePath);
  if (!absolutePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(400); res.end('Bad request'); return;
  }
  let stat;
  try { stat = await fs.promises.stat(absolutePath); }
  catch { res.writeHead(404); res.end('Not found'); return; }
  if (!stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(absolutePath).toLowerCase()] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': cacheControl });
  fs.createReadStream(absolutePath).pipe(res);
}

function workbooksForPath(urlPath) {
  return Object.entries(WORKBOOKS).filter(([, workbook]) => {
    const pagePath = workbook.page;
    const pageAlias = pagePath.slice(0, -'.html'.length);
    return urlPath === pagePath || urlPath === pageAlias || [workbook.script, workbook.engine, workbook.loader].includes(urlPath);
  });
}

function resolveStaticPath(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html') return 'index.html';
  if (['/register.html', '/parent-register.html', '/parent.html', '/forgot-password.html', '/reset-password.html'].includes(urlPath)) return urlPath.slice(1);
  if (urlPath === '/assets/css/site.css') return 'assets/css/site.css';
  if (urlPath === '/assets/css/access.css') return 'assets/css/access.css';
  if (urlPath === '/assets/css/parent.css') return 'assets/css/parent.css';
  if (urlPath === '/assets/css/interactive-workbook.css') return 'assets/css/interactive-workbook.css';
  if (urlPath === '/assets/css/curriculum-workbook.css') return 'assets/css/curriculum-workbook.css';
  if (urlPath === '/assets/js/site.js') return 'assets/js/site.js';
  if (['/assets/js/register.js', '/assets/js/parent-register.js', '/assets/js/forgot-password.js', '/assets/js/reset-password.js'].includes(urlPath)) return urlPath.slice(1);
  if (urlPath === '/parent.js') return 'assets/js/parent.js';
  if (urlPath === '/assets/favicon.svg') return 'assets/favicon.svg';
  if (urlPath === '/admin.js') return 'assets/js/admin.js';
  if (urlPath === '/admin.css') return 'assets/css/admin.css';
  return null;
}

async function handleApi(req, res, urlPath) {
  if (req.method === 'POST' && urlPath === '/api/auth/register') {
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    const invalid = accountSupport.validateRegistration(body, WORKBOOKS);
    if (invalid) return sendJson(res, 400, { error: invalid });
    if (body.privacyAcknowledged !== true) return sendJson(res, 400, { error: 'Please acknowledge the privacy notice before submitting.' });
    const ip = req.socket.remoteAddress || 'unknown';
    const attemptKey = `register:${ip}`; const state = currentAttemptState(attemptKey);
    state.count += 1; loginAttempts.set(attemptKey, state);
    if (state.count > 5) return sendJson(res, 429, { error: 'Too many registration attempts. Please try again later.' });
    const username = body.username.trim(); const email = body.email.trim().toLowerCase();
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase() || (user.email || '').toLowerCase() === email)) return sendJson(res, 409, { error: 'That username or email address is already registered.' });
    const passwordFields = await makePassword(body.password);
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase() || (user.email || '').toLowerCase() === email)) return sendJson(res, 409, { error: 'That username or email address is already registered.' });
    const created = {
      id: crypto.randomUUID(), username, role: 'student', accountType: 'learner', active: false, approvalStatus: 'pending', entitlements: [],
      requestedEntitlements: [...new Set(body.requestedEntitlements)], firstName: body.firstName.trim(), surname: body.surname.trim(),
      email, dateOfBirth: body.dateOfBirth, address: body.address.trim(), schoolYear: body.schoolYear,
      parentName: body.parentName?.trim() || '', parentEmail: body.parentEmail?.trim().toLowerCase() || '', parentEnabled: true, adminEnabled: true,
      ...passwordFields, createdAt: new Date().toISOString()
    };
    users.push(created); saveUsers();
    try {
      await accountSupport.sendEmail(localEmailEnv(), email, accountSupport.notificationEmail('pending', created), `registration-${created.id}-${email}`);
    } catch (error) {
      users = users.filter((user) => user.id !== created.id); saveUsers();
      return sendJson(res, 503, { error: error.message });
    }
    return sendJson(res, 201, { ok: true });
  }

  if (req.method === 'POST' && urlPath === '/api/auth/register-parent') {
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    const invalid = accountSupport.validateParentRegistration(body);
    if (invalid) return sendJson(res, 400, { error: invalid });
    if (body.privacyAcknowledged !== true) return sendJson(res, 400, { error: 'Please acknowledge the privacy notice before submitting.' });
    const ip = req.socket.remoteAddress || 'unknown'; const key = `parent-register:${ip}`; const attempt = currentAttemptState(key); attempt.count += 1; loginAttempts.set(key, attempt);
    if (attempt.count > 5) return sendJson(res, 429, { error: 'Too many registration attempts. Please try again later.' });
    const username = body.username.trim(); const email = body.email.trim().toLowerCase();
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase() || (user.email || '').toLowerCase() === email)) return sendJson(res, 409, { error: 'That username or email address is already registered.' });
    const passwordFields = await makePassword(body.password);
    if (users.some((user) => user.username.toLowerCase() === username.toLowerCase() || (user.email || '').toLowerCase() === email)) return sendJson(res, 409, { error: 'That username or email address is already registered.' });
    const parent = { id: crypto.randomUUID(), username, role: 'student', accountType: 'parent', parentId: null, active: false, approvalStatus: 'pending', entitlements: [], requestedEntitlements: [], parentEnabled: true, adminEnabled: true,
      firstName: body.firstName.trim(), surname: body.surname.trim(), email, dateOfBirth: body.dateOfBirth, address: body.address.trim(), schoolYear: '', parentName: '', parentEmail: '',
      ...passwordFields, createdAt: new Date().toISOString() };
    users.push(parent); saveUsers();
    try { await accountSupport.sendEmail(localEmailEnv(), email, accountSupport.notificationEmail('parent-pending', parent), `parent-registration-${parent.id}-${email}`); }
    catch (error) { users = users.filter((user) => user.id !== parent.id); saveUsers(); return sendJson(res, 503, { error: error.message }); }
    return sendJson(res, 201, { ok: true });
  }

  if (req.method === 'POST' && urlPath === '/api/auth/forgot-password') {
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    const generic = { message: 'If an active account matches that email, a reset link will be sent.' };
    const ipKey = `password-reset:${req.socket.remoteAddress || 'unknown'}`; const resetState = currentAttemptState(ipKey); resetState.count += 1; loginAttempts.set(ipKey, resetState);
    if (resetState.count > 5) return sendJson(res, 200, generic);
    if (body && typeof body === 'object' && accountSupport.validEmail(body.email)) {
      const email = body.email.trim().toLowerCase(); const user = users.find((item) => (item.email || '').toLowerCase() === email && item.active && (item.approvalStatus || 'approved') === 'approved');
      if (user && (!user.resetRequestedAt || Date.now() - user.resetRequestedAt > 60_000)) {
        const token = crypto.randomBytes(32).toString('hex'); user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex'); user.resetExpiresAt = Date.now() + 30 * 60 * 1000; user.resetRequestedAt = Date.now(); saveUsers();
        const baseUrl = process.env.PUBLIC_APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
        const resetUrl = new URL(`/reset-password.html?token=${token}`, baseUrl).toString();
        try { await accountSupport.sendEmail(localEmailEnv(), email, accountSupport.notificationEmail('reset', user, resetUrl), `password-reset-${user.resetTokenHash}`); }
        catch (error) { console.error('Password reset email could not be sent:', error.message); }
      }
    }
    return sendJson(res, 200, generic);
  }

  if (req.method === 'POST' && urlPath === '/api/auth/reset-password') {
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    if (!body || typeof body !== 'object' || typeof body.token !== 'string' || !/^[0-9a-f]{64}$/i.test(body.token)) return sendJson(res, 400, { error: 'This reset link is invalid or expired. Request a new link.' });
    if (!validPassword(body.password)) return sendJson(res, 400, { error: 'Password must be at least 12 characters.' });
    const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
    const user = users.find((item) => item.resetTokenHash === tokenHash && item.resetExpiresAt > Date.now());
    if (!user || !user.active) return sendJson(res, 400, { error: 'This reset link is invalid or expired. Request a new link.' });
    delete user.resetTokenHash; delete user.resetExpiresAt; delete user.resetRequestedAt; saveUsers();
    Object.assign(user, await makePassword(body.password));
    for (const [token, session] of sessions) if (session.userId === user.id) sessions.delete(token);
    saveUsers(); return sendJson(res, 200, { ok: true });
  }

  const accountAuth = getSession(req);
  if (req.method === 'GET' && urlPath === '/api/account') {
    if (!accountAuth) return sendJson(res, 401, { error: 'Sign in is required.' });
    return sendJson(res, 200, { profile: accountProfile(accountAuth.user) });
  }
  if (req.method === 'PATCH' && urlPath === '/api/account') {
    if (!accountAuth) return sendJson(res, 401, { error: 'Sign in is required.' });
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Profile details are invalid.' });
    const age = accountSupport.ageOnDate(body.dateOfBirth);
    if (['firstName','surname','address'].some((key) => typeof body[key] !== 'string' || !body[key].trim()) || body.firstName.length > 80 || body.surname.length > 80 || body.address.length > 500) return sendJson(res, 400, { error: 'Complete all required profile fields.' });
    if (!accountSupport.validEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' });
    if (accountAuth.user.accountType !== 'parent' && !accountSupport.SCHOOL_YEARS.includes(body.schoolYear)) return sendJson(res, 400, { error: 'Choose a valid school year.' });
    if (age === null) return sendJson(res, 400, { error: 'Enter a valid date of birth that is not in the future.' });
    if (age < 18 && (!body.parentName?.trim() || body.parentName.trim().length > 160 || !accountSupport.validEmail(body.parentEmail))) return sendJson(res, 400, { error: 'A parent or guardian name and email are required for applicants under 18.' });
    const email = body.email.trim().toLowerCase();
    if (email !== (accountAuth.user.email || '').toLowerCase() || (body.parentEmail?.trim().toLowerCase() || '') !== (accountAuth.user.parentEmail || '').toLowerCase()) return sendJson(res, 400, { error: 'Email addresses cannot be changed from this page. Contact an administrator to update them.' });
    if (users.some((item) => item.id !== accountAuth.user.id && (item.email || '').toLowerCase() === email)) return sendJson(res, 409, { error: 'That email address is already used by another account.' });
    Object.assign(accountAuth.user, { firstName: body.firstName.trim(), surname: body.surname.trim(), email, dateOfBirth: body.dateOfBirth, address: body.address.trim(), schoolYear: body.schoolYear || '', parentName: body.parentName?.trim() || '', parentEmail: body.parentEmail?.trim().toLowerCase() || '' });
    saveUsers(); return sendJson(res, 200, { profile: accountProfile(accountAuth.user) });
  }
  if (req.method === 'POST' && urlPath === '/api/account/email') {
    if (!accountAuth || accountAuth.user.role !== 'admin') return sendJson(res, 403, { error: 'Administrator access is required to change this email address.' });
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    if (!body || typeof body !== 'object' || !accountSupport.validEmail(body.email) || typeof body.currentPassword !== 'string') return sendJson(res, 400, { error: 'Enter a valid email address and your current password.' });
    if (!await passwordMatches(body.currentPassword, accountAuth.user)) return sendJson(res, 400, { error: 'Current password is incorrect.' });
    const email = body.email.trim().toLowerCase();
    if (users.some((item) => item.id !== accountAuth.user.id && (item.email || '').toLowerCase() === email)) return sendJson(res, 409, { error: 'That email address is already used by another account.' });
    accountAuth.user.email = email; saveUsers(); return sendJson(res, 200, { ok: true, email });
  }
  if (req.method === 'POST' && urlPath === '/api/account/password') {
    if (!accountAuth) return sendJson(res, 401, { error: 'Sign in is required.' });
    let body;
    try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
    if (typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') return sendJson(res, 400, { error: 'Enter your current password and a new password.' });
    if (!validPassword(body.newPassword)) return sendJson(res, 400, { error: 'New password must be at least 12 characters.' });
    if (!await passwordMatches(body.currentPassword, accountAuth.user)) return sendJson(res, 400, { error: 'Current password is incorrect.' });
    Object.assign(accountAuth.user, await makePassword(body.newPassword));
    for (const [token, session] of sessions) if (session.userId === accountAuth.user.id && token !== accountAuth.token) sessions.delete(token);
    saveUsers(); return sendJson(res, 200, { ok: true });
  }

  if (urlPath.startsWith('/api/parent/')) {
    const auth = getSession(req);
    if (!auth || auth.user.accountType !== 'parent') return sendJson(res, 403, { error: 'Approved parent or guardian access is required.' });
    if (req.method === 'GET' && urlPath === '/api/parent/children') {
      return sendJson(res, 200, { children: users.filter((user) => user.accountType === 'child' && user.parentId === auth.user.id).map(parentChild) });
    }
    if (req.method === 'POST' && urlPath === '/api/parent/children') {
      let body;
      try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Child details are invalid.' });
      if (typeof body.firstName !== 'string' || !body.firstName.trim() || body.firstName.trim().length > 80 || typeof body.surname !== 'string' || !body.surname.trim() || body.surname.trim().length > 80) return sendJson(res, 400, { error: 'Enter the child’s first name and surname.' });
      const age = accountSupport.ageOnDate(body.dateOfBirth);
      if (age === null || age >= 18) return sendJson(res, 400, { error: 'A child account must have a valid date of birth for someone under 18.' });
      if (!accountSupport.SCHOOL_YEARS.slice(0, 8).includes(body.schoolYear)) return sendJson(res, 400, { error: 'Choose a school year from Year 6 to Year 13.' });
      const username = String(body.username || '').trim();
      if (!validUsername(username)) return sendJson(res, 400, { error: 'Username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.' });
      if (!validPassword(body.password)) return sendJson(res, 400, { error: 'Password must be at least 12 characters.' });
      if (!isAllowedEntitlementList(body.requestedEntitlements) || !body.requestedEntitlements.length) return sendJson(res, 400, { error: 'Choose at least one workbook access request.' });
      if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username is already registered.' });
      const passwordFields = await makePassword(body.password);
      if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username is already registered.' });
      const child = { id: crypto.randomUUID(), username, role: 'student', accountType: 'child', parentId: auth.user.id, active: false, parentEnabled: true, adminEnabled: true, approvalStatus: 'pending',
        entitlements: [], requestedEntitlements: [...new Set(body.requestedEntitlements)], firstName: body.firstName.trim(), surname: body.surname.trim(),
        dateOfBirth: body.dateOfBirth, address: auth.user.address || '', schoolYear: body.schoolYear, email: '', parentName: `${auth.user.firstName} ${auth.user.surname}`.trim(), parentEmail: auth.user.email || '',
        ...passwordFields, createdAt: new Date().toISOString() };
      users.push(child); saveUsers(); return sendJson(res, 201, { child: parentChild(child) });
    }
    const childMatch = urlPath.match(/^\/api\/parent\/children\/([0-9a-f-]+)$/i);
    if (childMatch && req.method === 'PATCH') {
      let body;
      try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Child details are invalid.' });
      const child = users.find((user) => user.id === childMatch[1] && user.parentId === auth.user.id && user.accountType === 'child');
      if (!child) return sendJson(res, 404, { error: 'Child account not found.' });
      const firstName = body.firstName === undefined ? child.firstName : String(body.firstName).trim(); const surname = body.surname === undefined ? child.surname : String(body.surname).trim();
      const dateOfBirth = body.dateOfBirth === undefined ? child.dateOfBirth : body.dateOfBirth; const schoolYear = body.schoolYear === undefined ? child.schoolYear : body.schoolYear;
      const requested = body.requestedEntitlements === undefined ? child.requestedEntitlements : body.requestedEntitlements; let enabled = child.parentEnabled !== false;
      if (body.enabled !== undefined) { if (typeof body.enabled !== 'boolean') return sendJson(res, 400, { error: 'Child account enablement must be true or false.' }); enabled = body.enabled; }
      if (!firstName || firstName.length > 80 || !surname || surname.length > 80) return sendJson(res, 400, { error: 'Enter the child’s first name and surname.' });
      const age = accountSupport.ageOnDate(dateOfBirth); if (age === null || age >= 18) return sendJson(res, 400, { error: 'A child account must have a valid date of birth for someone under 18.' });
      if (!accountSupport.SCHOOL_YEARS.slice(0, 8).includes(schoolYear) || !isAllowedEntitlementList(requested)) return sendJson(res, 400, { error: 'Choose a valid school year and valid workbook requests.' });
      const uniqueRequested = [...new Set(requested)];
      const differsFromGranted = JSON.stringify([...uniqueRequested].sort()) !== JSON.stringify([...(child.entitlements || [])].sort());
      child.firstName = firstName; child.surname = surname; child.dateOfBirth = dateOfBirth; child.schoolYear = schoolYear; child.requestedEntitlements = uniqueRequested; child.parentEnabled = enabled;
      child.accessRequestStatus = child.approvalStatus === 'approved' && differsFromGranted ? 'pending' : 'none';
      child.active = Boolean(enabled && child.adminEnabled !== false && child.approvalStatus === 'approved'); saveUsers(); return sendJson(res, 200, { child: parentChild(child) });
    }
    if (childMatch && req.method === 'DELETE') {
      const child = users.find((user) => user.id === childMatch[1] && user.parentId === auth.user.id && user.accountType === 'child');
      if (!child) return sendJson(res, 404, { error: 'Child account not found.' });
      users = users.filter((user) => user.id !== child.id); for (const [token, session] of sessions) if (session.userId === child.id) sessions.delete(token); saveUsers(); return sendJson(res, 200, { ok: true });
    }
    const childPassword = urlPath.match(/^\/api\/parent\/children\/([0-9a-f-]+)\/password$/i);
    if (childPassword && req.method === 'POST') {
      let body;
      try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!body || !validPassword(body.password)) return sendJson(res, 400, { error: 'Password must be at least 12 characters.' });
      const child = users.find((user) => user.id === childPassword[1] && user.parentId === auth.user.id && user.accountType === 'child');
      if (!child) return sendJson(res, 404, { error: 'Child account not found.' });
      Object.assign(child, await makePassword(body.password)); for (const [token, session] of sessions) if (session.userId === child.id) sessions.delete(token); saveUsers(); return sendJson(res, 200, { ok: true });
    }
    return sendJson(res, 404, { error: 'Parent endpoint not found.' });
  }

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
    if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Request body must be an object.' });
    pruneLoginAttempts();
    const key = attemptKey(req, body.username);
    const state = currentAttemptState(key);
    const ipKey = ipAttemptKey(req);
    const ipState = currentAttemptState(ipKey);
    if (state.blockedUntil > Date.now() || ipState.blockedUntil > Date.now()) return sendJson(res, 429, { error: 'Too many sign-in attempts. Try again in 15 minutes.' });
    failLogin(key, 6);
    failLogin(ipKey, 31);
    const username = String(body.username || '').toLowerCase();
    const user = users.find((item) => item.username.toLowerCase() === username && item.active);
    const password = typeof body.password === 'string' && body.password.length <= 256 ? body.password : '';
    let matched = false;
    if (user) matched = await passwordMatches(password, user);
    else await scrypt(password.slice(0, 256), 'math-academy-login-salt', PASSWORD_BYTES);
    if (!matched) {
      pruneLoginAttempts();
      return sendJson(res, 401, { error: 'Username or password is incorrect.' });
    }
    loginAttempts.delete(key);
    loginAttempts.delete(ipKey);
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
      return sendJson(res, 200, { users: users.map(adminUser) });
    }

    const approveMatch = urlPath.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)\/approve$/i);
    if (req.method === 'POST' && approveMatch) {
      let body;
      try { body = await readJson(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!body || typeof body !== 'object' || !isAllowedEntitlementList(body.entitlements)) return sendJson(res, 400, { error: 'Select valid workbook access.' });
      const target = users.find((user) => user.id === approveMatch[1] && user.role === 'student' && (user.approvalStatus === 'pending' || user.accessRequestStatus === 'pending'));
      if (!target) return sendJson(res, 409, { error: 'This registration is no longer pending.' });
      const newApproval = target.approvalStatus === 'pending';
      if (target.accountType !== 'parent' && newApproval && !body.entitlements.length) return sendJson(res, 400, { error: 'Select at least one workbook to grant.' });
      target.approvalStatus = 'approved'; target.entitlements = [...new Set(body.entitlements)]; target.requestedEntitlements = [...target.entitlements]; target.accessRequestStatus = 'none';
      if (newApproval) target.active = target.parentEnabled !== false && target.adminEnabled !== false;
      saveUsers();
      const appUrl = process.env.PUBLIC_APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
      try { await accountSupport.sendToApplicantAndGuardian(localEmailEnv(), target, accountSupport.notificationEmail('approved', target, appUrl), `approval-${target.id}`); }
      catch (error) { return sendJson(res, 502, { error: `Access was approved, but the notification could not be sent. Use Send approval email to retry. ${error.message}` }); }
      return sendJson(res, 200, { user: adminUser(target) });
    }

    const rejectMatch = urlPath.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)$/i);
    if (req.method === 'DELETE' && rejectMatch) {
      const target = users.find((user) => user.id === rejectMatch[1] && user.approvalStatus === 'pending' && user.role === 'student');
      if (!target) return sendJson(res, 409, { error: 'This registration is no longer pending.' });
      users = users.filter((user) => user.id !== target.id); saveUsers(); return sendJson(res, 200, { ok: true });
    }

    const rejectAccessMatch = urlPath.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)\/reject-access$/i);
    if (req.method === 'POST' && rejectAccessMatch) {
      const target = users.find((user) => user.id === rejectAccessMatch[1] && user.accessRequestStatus === 'pending' && user.approvalStatus === 'approved');
      if (!target) return sendJson(res, 409, { error: 'This access request is no longer pending.' });
      target.requestedEntitlements = [...(target.entitlements || [])]; target.accessRequestStatus = 'none'; saveUsers();
      return sendJson(res, 200, { user: adminUser(target) });
    }

    const approvalEmailMatch = urlPath.match(/^\/api\/admin\/users\/([0-9a-f-]+)\/approval-email$/i);
    if (req.method === 'POST' && approvalEmailMatch) {
      const target = users.find((user) => user.id === approvalEmailMatch[1] && user.active && (user.approvalStatus || 'approved') === 'approved');
      if (!target) return sendJson(res, 404, { error: 'Approved account not found.' });
      const appUrl = process.env.PUBLIC_APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
      try { await accountSupport.sendToApplicantAndGuardian(localEmailEnv(), target, accountSupport.notificationEmail('approved', target, appUrl), `approval-retry-${target.id}-${Date.now()}`); }
      catch (error) { return sendJson(res, 502, { error: error.message }); }
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && urlPath === '/api/admin/users') {
      let body;
      try { body = await readJson(req); }
      catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Request body must be an object.' });
      const username = String(body.username || '').trim();
      const role = body.role === undefined ? 'student' : body.role;
      if (!['student', 'admin'].includes(role)) return sendJson(res, 400, { error: 'Choose either student or administrator.' });
      if (!validUsername(username)) return sendJson(res, 400, { error: 'Username must be 3–32 characters using letters, numbers, dots, underscores or hyphens.' });
      if (!validPassword(body.password)) return sendJson(res, 400, { error: 'Password must be at least 12 characters.' });
      if (users.some((item) => item.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username already exists.' });
      if (!isAllowedEntitlementList(body.entitlements || [])) return sendJson(res, 400, { error: 'One or more workbook entitlements are invalid.' });
      const passwordFields = await makePassword(body.password);
      if (users.some((item) => item.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username already exists.' });
      const created = { id: crypto.randomUUID(), username, role, accountType: role === 'admin' ? 'admin' : 'learner', active: true, adminEnabled: true, parentEnabled: true, approvalStatus: 'approved', entitlements: role === 'admin' ? Object.keys(WORKBOOKS) : [...new Set(body.entitlements || [])], requestedEntitlements: [], ...passwordFields, createdAt: new Date().toISOString() };
      users.push(created); saveUsers();
      return sendJson(res, 201, { user: publicUser(created) });
    }

    const match = urlPath.match(/^\/api\/admin\/users\/([0-9a-f-]+)$/i);
    if (req.method === 'DELETE' && match) {
      const target = users.find((user) => user.id === match[1]);
      if (!target) return sendJson(res, 404, { error: 'User not found.' });
      if (target.role === 'admin' && target.active && users.filter((user) => user.role === 'admin' && user.active).length < 2) return sendJson(res, 400, { error: 'Keep at least one active administrator.' });
      const deletedIds = new Set([target.id]);
      if (target.accountType === 'parent') users.filter((user) => user.parentId === target.id).forEach((user) => deletedIds.add(user.id));
      users = users.filter((user) => !deletedIds.has(user.id));
      for (const [token, session] of sessions) if (deletedIds.has(session.userId)) sessions.delete(token);
      saveUsers(); return sendJson(res, 200, { ok: true });
    }
    if (req.method === 'PATCH' && match) {
      let body;
      try { body = await readJson(req); }
      catch (error) { return sendJson(res, 400, { error: error.message }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Request body must be an object.' });
      const target = users.find((item) => item.id === match[1]);
      if (!target) return sendJson(res, 404, { error: 'User not found.' });
      if (body.username !== undefined) {
        const username = String(body.username).trim();
        if (!validUsername(username)) return sendJson(res, 400, { error: 'Username must be 3–32 valid characters.' });
        if (users.some((item) => item.id !== target.id && item.username.toLowerCase() === username.toLowerCase())) return sendJson(res, 409, { error: 'That username already exists.' });
      }
      if (body.entitlements !== undefined && !isAllowedEntitlementList(body.entitlements)) return sendJson(res, 400, { error: 'One or more workbook entitlements are invalid.' });
      if (body.active !== undefined && typeof body.active !== 'boolean') return sendJson(res, 400, { error: 'Active must be true or false.' });
      if (body.email !== undefined) {
        if (!accountSupport.validEmail(body.email)) return sendJson(res, 400, { error: 'Enter a valid email address.' });
        if (users.some((item) => item.id !== target.id && (item.email || '').toLowerCase() === body.email.trim().toLowerCase())) return sendJson(res, 409, { error: 'That email address is already used by another account.' });
      }
      if (body.active === false && target.role === 'admin' && users.filter((item) => item.role === 'admin' && item.active).length < 2) return sendJson(res, 400, { error: 'Keep at least one active administrator.' });
      if (body.username !== undefined) target.username = String(body.username).trim();
      if (body.email !== undefined) target.email = body.email.trim().toLowerCase();
      if (body.entitlements !== undefined) target.entitlements = [...new Set(body.entitlements)];
      if (body.active !== undefined) {
        target.adminEnabled = body.active;
        target.active = Boolean(body.active && target.parentEnabled !== false && (target.approvalStatus || 'approved') === 'approved');
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
      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(res, 400, { error: 'Request body must be an object.' });
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
  WORKBOOKS = (await import('./workbooks.mjs')).default;
  accountSupport = await import('./account-support.mjs');
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  try { users = JSON.parse(fs.readFileSync(USER_STORE, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    users = [];
    saveUsers();
  }
  if (!Array.isArray(users)) throw new Error('User store is invalid.');
  users.forEach((user) => {
    if (!user.approvalStatus) user.approvalStatus = 'approved';
    if (!Array.isArray(user.requestedEntitlements)) user.requestedEntitlements = [];
    if (!user.accountType) user.accountType = user.role === 'admin' ? 'admin' : 'learner';
    if (user.parentEnabled === undefined) user.parentEnabled = true;
    if (user.adminEnabled === undefined) user.adminEnabled = user.approvalStatus === 'pending' ? true : Boolean(user.active);
  });

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
      if (req.method !== 'GET') {
        const requestOrigin = req.headers.origin;
        const targetOrigin = `http://${req.headers.host || 'localhost'}`;
        if (!requestOrigin || requestOrigin !== targetOrigin) return sendJson(res, 403, { error: 'Request origin is not allowed.' });
      }
      try { await handleApi(req, res, urlPath); }
      catch (error) { console.error('API error:', error); if (!res.headersSent) sendJson(res, 500, { error: 'The request could not be completed.' }); }
      return;
    }

    const auth = getSession(req);
    if (ADMIN_FILES.has(urlPath)) {
      if (!auth || auth.user.role !== 'admin') { res.writeHead(auth ? 403 : 401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(auth ? 'Administrator access required.' : 'Please sign in as an administrator.'); return; }
      const file = urlPath === '/admin.html' ? 'admin.html' : resolveStaticPath(urlPath);
      return serveFile(res, file, 'no-store');
    }

    if (ACCOUNT_FILES.has(urlPath)) {
      if (!auth) { res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('Sign in is required.'); return; }
      return serveFile(res, ACCOUNT_FILES.get(urlPath), 'no-store');
    }

    if (PARENT_FILES.has(urlPath)) {
      if (!auth) { res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('Sign in is required.'); return; }
      if (auth.user.accountType !== 'parent') { res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end('Parent or guardian access is required.'); return; }
      return serveFile(res, PARENT_FILES.get(urlPath), 'no-store');
    }

    const matchingWorkbooks = workbooksForPath(urlPath);
    if (matchingWorkbooks.length) {
      const allowed = auth && (auth.user.role === 'admin' || matchingWorkbooks.some(([key]) => auth.user.entitlements.includes(key)));
      if (!allowed) { res.writeHead(auth ? 403 : 401, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(auth ? 'This account does not have access to this workbook.' : 'Sign in is required.'); return; }
      const pageMatch = matchingWorkbooks.find(([, workbook]) => urlPath === workbook.page || urlPath === workbook.page.slice(0, -'.html'.length));
      const scriptMatch = matchingWorkbooks.find(([, workbook]) => urlPath === workbook.script);
      const engineMatch = matchingWorkbooks.find(([, workbook]) => urlPath === workbook.engine);
      const loaderMatch = matchingWorkbooks.find(([, workbook]) => urlPath === workbook.loader);
      const file = pageMatch ? pageMatch[1].file : scriptMatch ? scriptMatch[1].script.slice(1) : engineMatch ? engineMatch[1].engine.slice(1) : loaderMatch[1].loader.slice(1);
      return serveFile(res, file, 'private, no-store');
    }

    const staticPath = resolveStaticPath(urlPath);
    if (staticPath) return serveFile(res, staticPath, 'public, max-age=300');
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  const HOST = process.env.HOST || '127.0.0.1';
  server.listen(PORT, HOST, () => console.log(`Math Academy access server listening on http://${HOST}:${PORT}`));
}

main().catch((error) => { console.error(error.message); process.exit(1); });
