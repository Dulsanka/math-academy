import WORKBOOKS from './workbooks.mjs';
import { SCHOOL_YEARS, ageOnDate, sendEmail, sendToApplicantAndGuardian, notificationEmail, validateParentRegistration, normalizeProgressSummary, validEmail, accountSetupLinkExpiry } from './account-support.mjs';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Cloudflare Workers supports up to 100,000 PBKDF2 iterations per operation.
const PASSWORD_ITERATIONS = 100_000;
const SESSION_COOKIE = '__Host-math_academy_session';

const PUBLIC_ASSETS = new Set([
  '/', '/index.html', '/assets/css/site.css', '/assets/css/interactive-workbook.css',
  '/assets/css/curriculum-workbook.css', '/assets/css/access.css', '/assets/css/parent.css', '/assets/js/site.js',
  '/assets/js/reset-password.js', '/assets/js/forgot-password.js', '/assets/js/parent-register.js', '/parent-register.html', '/forgot-password.html',
  '/reset-password.html', '/assets/favicon.svg'
]);

let bootstrapPromise;
const ADMIN_ASSETS = new Map([
  ['/admin.html', '/admin.html'],
  ['/admin.js', '/assets/js/admin.js'],
  ['/admin.css', '/assets/css/admin.css']
]);
const ACCOUNT_ASSETS = new Map([['/account.html', '/account.html'], ['/account.js', '/assets/js/account.js']]);
const PARENT_ASSETS = new Map([['/parent.html', '/parent.html'], ['/parent.js', '/assets/js/parent.js']]);

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
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; object-src 'none'");
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
    accountType: row.role === 'admin' ? 'admin' : (row.account_type || 'learner'),
    active: Boolean(row.active),
    entitlements
  };
}

function adminUser(row) {
  return {
    ...publicUser(row), approvalStatus: row.approval_status || 'approved',
    firstName: row.first_name || '', surname: row.surname || '', email: row.email || '',
    dateOfBirth: row.date_of_birth || '', address: row.address || '', schoolYear: row.school_year || '',
    requestedEntitlements: parseEntitlements(row.requested_entitlements),
    parentName: row.parent_name || '', parentEmail: row.parent_email || '', parentId: row.parent_id || '', accessRequestStatus: row.access_request_status || 'none', createdAt: row.created_at
  };
}

function parseEntitlements(value) {
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

function sameEntitlements(left, right) {
  return Array.isArray(left) && Array.isArray(right) && [...new Set(left)].sort().join('\0') === [...new Set(right)].sort().join('\0');
}

function accountProfile(row) {
  return {
    id: row.id, username: row.username, role: row.role, accountType: row.role === 'admin' ? 'admin' : (row.account_type || 'learner'),
    firstName: row.first_name || '', surname: row.surname || '', email: row.email || '',
    dateOfBirth: row.date_of_birth || '', address: row.address || '', schoolYear: row.school_year || '',
    parentName: row.parent_name || '', parentEmail: row.parent_email || ''
  };
}

function parentChild(row) {
  return {
    id: row.id, username: row.username, firstName: row.first_name || '', surname: row.surname || '',
    dateOfBirth: row.date_of_birth || '', schoolYear: row.school_year || '',
    approvalStatus: row.approval_status || 'approved', accessRequestStatus: row.access_request_status || 'none', enabled: Boolean(row.parent_enabled),
    entitlements: parseEntitlements(row.entitlements), requestedEntitlements: parseEntitlements(row.requested_entitlements)
  };
}

function progressSession(row) {
  let topics = [];
  try { topics = JSON.parse(row.topics_json || '[]'); } catch { /* Ignore malformed progress summaries. */ }
  return {
    sessionId: row.session_id, workbookKey: row.workbook_key, moduleKey: row.module_key, title: row.module_title,
    totalQuestions: row.total_questions, completedQuestions: row.completed_questions, errorCount: row.error_count,
    elapsedSeconds: row.elapsed_seconds, stars: row.stars, topics, lastActivity: row.last_activity
  };
}

function validProfile(body, requireSchoolYear = true, isAdmin = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Profile details are invalid.';
  const age = ageOnDate(body.dateOfBirth);
  const requiredFields = ['firstName', 'surname'];
  if (!isAdmin) requiredFields.push('address');
  if (requireSchoolYear) requiredFields.push('schoolYear');
  if (requiredFields.some((key) => typeof body[key] !== 'string' || !body[key].trim())) return 'Complete all required profile fields.';
  if (body.firstName.trim().length > 80 || body.surname.trim().length > 80 || String(body.address || '').trim().length > 500) return 'Some profile fields are too long.';
  if (body.email && !validEmail(body.email)) return 'Enter a valid email address.';
  if (requireSchoolYear && !SCHOOL_YEARS.includes(body.schoolYear)) return 'Choose a valid school year.';
  if (!isAdmin && age === null) return 'Enter a valid date of birth that is not in the future.';
  if (!isAdmin && age < 18 && (!body.parentName?.trim() || body.parentName.trim().length > 160 || !validEmail(body.parentEmail))) return 'A parent or guardian name and email are required for applicants under 18.';
  return null;
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

async function sendAccountInvitation(env, user, appUrl) {
  const now = Date.now();
  const { expiresInMs, label: expiryLabel } = accountSetupLinkExpiry(user);
  const token = randomHex(32);
  const tokenHash = await digestHex(token);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= ?').bind(user.id, now),
    env.DB.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(tokenHash, user.id, now + expiresInMs, now)
  ]);
  const setupUrl = new URL(`/reset-password.html?token=${token}`, appUrl).toString();
  const deliveries = await Promise.allSettled([
    sendEmail(env, user.email, notificationEmail('account-username', user, appUrl)),
    sendEmail(env, user.email, notificationEmail('account-password-setup', { ...user, setupExpiryLabel: expiryLabel }, setupUrl))
  ]);
  const failed = deliveries.filter((result) => result.status === 'rejected');
  if (failed.length) throw new Error(`Account created, but ${failed.length} of the two account setup emails could not be sent.`);
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
  const contentType = (request.headers.get('Content-Type') || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new Error('Request must use JSON.');
  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > 16_384) throw new Error('Request is too large.');
  if (!request.body) throw new Error('Request body must be valid JSON.');
  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 16_384) {
        await reader.cancel();
        throw new Error('Request is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(body) || '{}'); }
  catch { throw new Error('Request body must be valid JSON.'); }
}

async function getAuth(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token || !/^[0-9a-f]{64}$/i.test(token)) return null;
  const tokenHash = await digestHex(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.role, u.account_type, u.active, u.entitlements, u.email, u.parent_email
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`
  ).bind(tokenHash, Date.now()).first();
  return row ? { tokenHash, email: row.email || '', parentEmail: row.parent_email || '', user: publicUser(row) } : null;
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

async function consumeLoginAttempt(env, key, limit, now) {
  return env.DB.prepare(
    `INSERT INTO login_attempts (attempt_key, attempt_count, window_ends_at, blocked_until)
     VALUES (?, 1, ?, 0)
     ON CONFLICT(attempt_key) DO UPDATE SET
       attempt_count = CASE WHEN login_attempts.window_ends_at > ? THEN login_attempts.attempt_count + 1 ELSE 1 END,
       window_ends_at = CASE WHEN login_attempts.window_ends_at > ? THEN login_attempts.window_ends_at ELSE ? END,
       blocked_until = CASE
         WHEN login_attempts.blocked_until > ? THEN login_attempts.blocked_until
         WHEN (CASE WHEN login_attempts.window_ends_at > ? THEN login_attempts.attempt_count + 1 ELSE 1 END) >= ? THEN ?
         WHEN login_attempts.window_ends_at > ? THEN login_attempts.blocked_until
         ELSE 0 END
     RETURNING attempt_count, window_ends_at, blocked_until`
  ).bind(key, now + LOGIN_WINDOW_MS, now, now, now + LOGIN_WINDOW_MS, now, now, limit + 1, now + LOGIN_WINDOW_MS, now).first();
}

async function handleApi(request, env, url) {
  const { pathname } = url;
  const now = Date.now();

  if (pathname === '/api/auth/register' && request.method === 'POST') {
    return json({ error: 'Only parents or guardians can register. Create a parent account and add each child there.' }, 403);
  }

  if (pathname === '/api/auth/register-parent' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const invalid = validateParentRegistration(body, WORKBOOKS);
    if (invalid) return json({ error: invalid }, 400);
    if (body.privacyAcknowledged !== true) return json({ error: 'Please acknowledge the privacy notice before submitting.' }, 400);
    const ip = (request.headers.get('CF-Connecting-IP') || 'unknown').slice(0, 80);
    const attempt = await consumeLoginAttempt(env, `parent-register:${ip}`, 5, now);
    if (attempt.blocked_until > now) return json({ error: 'Too many registration attempts. Please try again later.' }, 429);
    const username = body.username.trim(); const email = body.email.trim().toLowerCase();
    const registrations = [{ username, email }, ...body.children.map((child) => ({ username: child.username.trim(), email: '' }))];
    const seen = new Set();
    for (const registration of registrations) {
      const key = registration.username.toLowerCase();
      if (seen.has(key)) return json({ error: 'Parent and child usernames must all be unique.' }, 409);
      seen.add(key);
      const existingUsername = await env.DB.prepare('SELECT id FROM users WHERE username_key=lower(?) LIMIT 1').bind(registration.username).first();
      if (existingUsername) return json({ error: `The username ${registration.username} is already in use. Choose a different username for that account.` }, 409);
      if (registration.email) {
        const existingEmail = await env.DB.prepare('SELECT id FROM users WHERE email_key=lower(?) LIMIT 1').bind(registration.email).first();
        if (existingEmail) return json({ error: 'That parent email address is already linked to an account. Sign in or contact an administrator.' }, 409);
      }
    }
    const parentSalt = randomHex(16); const parentHash = await derivePassword(body.password, parentSalt); const id = crypto.randomUUID();
    const statements = [env.DB.prepare(
      `INSERT INTO users (id, username, username_key, role, account_type, active, approval_status, entitlements, requested_entitlements,
        password_salt, password_hash, created_at, first_name, surname, email, email_key, date_of_birth, address)
       VALUES (?, ?, lower(?), 'student', 'parent', 0, 'pending', '[]', '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, username, username, parentSalt, parentHash, now, body.firstName.trim(), body.surname.trim(), email, email, body.dateOfBirth, body.address.trim())];
    for (const child of body.children) {
      const childSalt = randomHex(16); const childHash = await derivePassword(child.password, childSalt); const childId = crypto.randomUUID();
      statements.push(env.DB.prepare(
        `INSERT INTO users (id, username, username_key, role, account_type, parent_id, active, parent_enabled, admin_enabled, approval_status,
          entitlements, requested_entitlements, password_salt, password_hash, created_at, first_name, surname, email, email_key,
          date_of_birth, address, school_year, parent_name, parent_email)
         VALUES (?, ?, lower(?), 'student', 'child', ?, 1, 1, 1, 'pending', '[]', ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?)`
      ).bind(childId, child.username.trim(), child.username.trim(), id, JSON.stringify([...new Set(child.requestedEntitlements)]), childSalt, childHash, now,
        child.firstName.trim(), child.surname.trim(), child.dateOfBirth, body.address.trim(), child.schoolYear, `${body.firstName.trim()} ${body.surname.trim()}`.trim(), email));
    }
    try { await env.DB.batch(statements); }
    catch (error) {
      if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'A parent or child username/email is already registered.' }, 409);
      throw error;
    }
    try {
      await sendEmail(env, email, notificationEmail('parent-pending', { firstName: body.firstName }));
      return json({ ok: true, emailSent: true }, 201);
    } catch (error) {
      console.error('Family registration receipt could not be sent:', error.message);
      return json({ ok: true, emailSent: false, message: 'Your family registration was saved, but the receipt email could not be sent. An administrator can resend it. Children can sign in, but their workbook pages remain locked until approved.' }, 202);
    }
  }

  if (pathname === '/api/auth/forgot-password' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const ip = (request.headers.get('CF-Connecting-IP') || 'unknown').slice(0, 80);
    const resetAttempt = await consumeLoginAttempt(env, `password-reset:${ip}`, 5, now);
    if (resetAttempt.blocked_until > now) return json({ message: 'If an active account matches that email, a reset link will be sent.' });
    if (!body || typeof body !== 'object' || !validEmail(body.email)) return json({ message: 'If an active account matches that email, a reset link will be sent.' });
    const email = body.email.trim().toLowerCase();
    const user = await env.DB.prepare("SELECT * FROM users WHERE lower(email) = ? AND active = 1 AND approval_status = 'approved' LIMIT 1").bind(email).first();
    if (user) {
      const recent = await env.DB.prepare('SELECT token_hash FROM password_resets WHERE user_id = ? AND created_at > ? LIMIT 1').bind(user.id, now - 60_000).first();
      if (!recent) {
        const token = randomHex(32);
        const tokenHash = await digestHex(token);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= ?').bind(user.id, now),
          env.DB.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(tokenHash, user.id, now + 30 * 60 * 1000, now)
        ]);
        const resetUrl = new URL(`/reset-password.html?token=${token}`, url.origin).toString();
        try { await sendEmail(env, email, notificationEmail('reset', user, resetUrl)); }
        catch (error) { console.error('Password reset email could not be sent:', error.message); }
      }
    }
    return json({ message: 'If an active account matches that email, a reset link will be sent.' });
  }

  if (pathname === '/api/auth/reset-password' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || typeof body.token !== 'string' || !/^[0-9a-f]{64}$/i.test(body.token)) return json({ error: 'This reset link is invalid or expired. Request a new link.' }, 400);
    if (!validPassword(body.password)) return json({ error: 'Password must be at least 12 characters.' }, 400);
    const tokenHash = await digestHex(body.token);
    const reset = await env.DB.prepare('DELETE FROM password_resets WHERE token_hash = ? AND expires_at > ? RETURNING user_id').bind(tokenHash, now).first();
    if (!reset) return json({ error: 'This reset link is invalid or expired. Request a new link.' }, 400);
    const salt = randomHex(16);
    const passwordHash = await derivePassword(body.password, salt);
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ? AND active = 1 AND approval_status = 'approved'").bind(salt, passwordHash, reset.user_id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id),
      env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(reset.user_id)
    ]);
    return json({ ok: true });
  }

  const accountAuth = pathname.startsWith('/api/account') ? await getAuth(request, env) : null;
  if (pathname.startsWith('/api/account') && accountAuth?.user.accountType === 'child') return json({ error: 'Child accounts are managed by a parent or guardian.' }, 403);
  if (pathname === '/api/account' && request.method === 'GET') {
    if (!accountAuth) return json({ error: 'Sign in is required.' }, 401);
    const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(accountAuth.user.id).first();
    return json({ profile: accountProfile(row) });
  }

  if (pathname === '/api/account' && request.method === 'PATCH') {
    if (!accountAuth) return json({ error: 'Sign in is required.' }, 401);
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const isAdmin = accountAuth.user.role === 'admin';
    const isParent = accountAuth.user.accountType === 'parent';
    const invalid = validProfile(body, !isParent && !isAdmin, isAdmin);
    if (invalid) return json({ error: invalid }, 400);
    const email = (body.email || accountAuth.email).trim().toLowerCase();
    if (email !== accountAuth.email.toLowerCase() || (!isAdmin && (body.parentEmail?.trim().toLowerCase() || '') !== accountAuth.parentEmail.toLowerCase())) {
      return json({ error: 'Email addresses cannot be changed from this page. Contact an administrator to update them.' }, 400);
    }
    if (email) {
      const duplicate = await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ? LIMIT 1').bind(email, accountAuth.user.id).first();
      if (duplicate) return json({ error: 'That email address is already used by another account.' }, 409);
    }
    if (isAdmin) {
      await env.DB.prepare('UPDATE users SET first_name=?, surname=? WHERE id=?').bind(body.firstName.trim(), body.surname.trim(), accountAuth.user.id).run();
    } else {
      await env.DB.prepare('UPDATE users SET first_name=?, surname=?, email=?, date_of_birth=?, address=?, school_year=?, parent_name=?, parent_email=? WHERE id=?')
        .bind(body.firstName.trim(), body.surname.trim(), email, body.dateOfBirth, body.address.trim(), body.schoolYear,
          body.parentName?.trim() || '', body.parentEmail?.trim().toLowerCase() || '', accountAuth.user.id).run();
    }
    const row = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(accountAuth.user.id).first();
    return json({ profile: accountProfile(row) });
  }

  if (pathname === '/api/account/email' && request.method === 'POST') {
    const accountAuth = await getAuth(request, env);
    if (!accountAuth || accountAuth.user.role !== 'admin') return json({ error: 'Administrator access is required to change this email address.' }, 403);
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || !validEmail(body.email) || typeof body.currentPassword !== 'string') return json({ error: 'Enter a valid email address and your current password.' }, 400);
    const row = await env.DB.prepare('SELECT password_salt,password_hash FROM users WHERE id=?').bind(accountAuth.user.id).first();
    if (!equalHex(await derivePassword(body.currentPassword, row.password_salt), row.password_hash)) return json({ error: 'Current password is incorrect.' }, 400);
    const email = body.email.trim().toLowerCase();
    const duplicate = await env.DB.prepare('SELECT id FROM users WHERE email_key=lower(?) AND id != ? LIMIT 1').bind(email, accountAuth.user.id).first();
    if (duplicate) return json({ error: 'That email address is already used by another account.' }, 409);
    try { await env.DB.prepare('UPDATE users SET email=?,email_key=lower(?) WHERE id=?').bind(email, email, accountAuth.user.id).run(); }
    catch (error) { if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'That email address is already used by another account.' }, 409); throw error; }
    return json({ ok: true, email });
  }

  if (pathname === '/api/account/password' && request.method === 'POST') {
    if (!accountAuth) return json({ error: 'Sign in is required.' }, 401);
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') return json({ error: 'Enter your current password and a new password.' }, 400);
    if (!validPassword(body.newPassword)) return json({ error: 'New password must be at least 12 characters.' }, 400);
    const row = await env.DB.prepare('SELECT password_salt, password_hash FROM users WHERE id = ?').bind(accountAuth.user.id).first();
    if (!equalHex(await derivePassword(body.currentPassword, row.password_salt), row.password_hash)) return json({ error: 'Current password is incorrect.' }, 400);
    const salt = randomHex(16);
    const passwordHash = await derivePassword(body.newPassword, salt);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_salt=?, password_hash=? WHERE id=?').bind(salt, passwordHash, accountAuth.user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash != ?').bind(accountAuth.user.id, accountAuth.tokenHash)
    ]);
    return json({ ok: true });
  }

  if (pathname === '/api/progress' && request.method === 'POST') {
    const progressAuth = await getAuth(request, env);
    if (!progressAuth || progressAuth.user.accountType !== 'child') return json({ error: 'Progress can only be recorded for an active child account.' }, 403);
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    const summary = normalizeProgressSummary(body, WORKBOOKS);
    if (!summary) return json({ error: 'The progress summary is invalid.' }, 400);
    if (!progressAuth.user.entitlements.includes(summary.workbookKey)) return json({ error: 'This child does not have access to that workbook.' }, 403);
    await env.DB.prepare(
      `INSERT INTO progress_sessions (user_id, session_id, workbook_key, module_key, module_title, total_questions, completed_questions,
        error_count, elapsed_seconds, stars, topics_json, last_activity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, session_id) DO UPDATE SET workbook_key=excluded.workbook_key, module_key=excluded.module_key,
        module_title=excluded.module_title, total_questions=excluded.total_questions, completed_questions=excluded.completed_questions,
        error_count=excluded.error_count, elapsed_seconds=excluded.elapsed_seconds, stars=excluded.stars, topics_json=excluded.topics_json,
        last_activity=excluded.last_activity`
    ).bind(progressAuth.user.id, summary.sessionId, summary.workbookKey, summary.moduleKey, summary.title, summary.totalQuestions,
      summary.completedQuestions, summary.errorCount, summary.elapsedSeconds, summary.stars, JSON.stringify(summary.topics), now).run();
    return json({ ok: true, lastActivity: now });
  }

  if (pathname.startsWith('/api/parent/')) {
    const parentAuth = await getAuth(request, env);
    if (!parentAuth || parentAuth.user.accountType !== 'parent') return json({ error: 'Approved parent or guardian access is required.' }, 403);
    if (pathname === '/api/parent/dashboard' && request.method === 'GET') {
      const result = await env.DB.prepare(
        `SELECT c.id, c.username, c.first_name, c.surname, c.school_year, c.active, c.approval_status,
          p.session_id, p.workbook_key, p.module_key, p.module_title, p.total_questions, p.completed_questions,
          p.error_count, p.elapsed_seconds, p.stars, p.topics_json, p.last_activity
         FROM users c LEFT JOIN progress_sessions p ON p.user_id=c.id
         WHERE c.parent_id=? AND c.account_type='child'
         ORDER BY c.first_name, c.surname, p.last_activity DESC LIMIT 3000`
      ).bind(parentAuth.user.id).all();
      const children = new Map();
      for (const row of result.results || []) {
        if (!children.has(row.id)) children.set(row.id, { id: row.id, username: row.username, firstName: row.first_name || '', surname: row.surname || '', schoolYear: row.school_year || '', active: Boolean(row.active), approvalStatus: row.approval_status, sessions: [] });
        if (row.session_id) children.get(row.id).sessions.push(progressSession(row));
      }
      return json({ children: [...children.values()] });
    }
    if (pathname === '/api/parent/children' && request.method === 'GET') {
      const result = await env.DB.prepare("SELECT * FROM users WHERE parent_id=? AND account_type='child' ORDER BY username_key").bind(parentAuth.user.id).all();
      return json({ children: (result.results || []).map(parentChild) });
    }
    if (pathname === '/api/parent/children' && request.method === 'POST') {
      let body;
      try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Child details are invalid.' }, 400);
      if (typeof body.firstName !== 'string' || !body.firstName.trim() || body.firstName.trim().length > 80 || typeof body.surname !== 'string' || !body.surname.trim() || body.surname.trim().length > 80) return json({ error: 'Enter the child’s first name and surname.' }, 400);
      const age = ageOnDate(body.dateOfBirth);
      if (age === null || age >= 18) return json({ error: 'A child account must have a valid date of birth for someone under 18.' }, 400);
      if (!SCHOOL_YEARS.slice(0, 8).includes(body.schoolYear)) return json({ error: 'Choose a school year from Year 6 to Year 13.' }, 400);
      if (!validUsername(body.username)) return json({ error: 'Username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.' }, 400);
      if (!validPassword(body.password)) return json({ error: 'Password must be at least 12 characters.' }, 400);
      if (!allowedEntitlementList(body.requestedEntitlements) || !body.requestedEntitlements.length) return json({ error: 'Choose at least one workbook access request.' }, 400);
      const parent = await env.DB.prepare('SELECT * FROM users WHERE id=? AND account_type=\'parent\' AND active=1').bind(parentAuth.user.id).first();
      const salt = randomHex(16); const passwordHash = await derivePassword(body.password, salt); const id = crypto.randomUUID();
      try {
        await env.DB.prepare(
          `INSERT INTO users (id, username, username_key, role, account_type, parent_id, active, parent_enabled, admin_enabled, approval_status,
            entitlements, requested_entitlements, password_salt, password_hash, created_at, first_name, surname, email, email_key,
            date_of_birth, address, school_year, parent_name, parent_email)
           VALUES (?, ?, lower(?), 'student', 'child', ?, 1, 1, 1, 'pending', '[]', ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?)`
        ).bind(id, body.username.trim(), body.username.trim(), parentAuth.user.id, JSON.stringify([...new Set(body.requestedEntitlements)]),
          salt, passwordHash, now, body.firstName.trim(), body.surname.trim(), body.dateOfBirth, parent.address, body.schoolYear,
          `${parent.first_name} ${parent.surname}`.trim(), parent.email).run();
      } catch (error) {
        if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'That username is already registered.' }, 409);
        throw error;
      }
      const created = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
      return json({ child: parentChild(created) }, 201);
    }
    const childMatch = pathname.match(/^\/api\/parent\/children\/([0-9a-f-]+)$/i);
    if (childMatch && request.method === 'PATCH') {
      let body;
      try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Child details are invalid.' }, 400);
      const child = await env.DB.prepare("SELECT * FROM users WHERE id=? AND parent_id=? AND account_type='child'").bind(childMatch[1], parentAuth.user.id).first();
      if (!child) return json({ error: 'Child account not found.' }, 404);
      const firstName = body.firstName === undefined ? child.first_name : String(body.firstName).trim();
      const surname = body.surname === undefined ? child.surname : String(body.surname).trim();
      const dateOfBirth = body.dateOfBirth === undefined ? child.date_of_birth : body.dateOfBirth;
      const schoolYear = body.schoolYear === undefined ? child.school_year : body.schoolYear;
      const requested = body.requestedEntitlements === undefined ? parseEntitlements(child.requested_entitlements) : body.requestedEntitlements;
      let enabled = Boolean(child.parent_enabled);
      if (body.enabled !== undefined) {
        if (typeof body.enabled !== 'boolean') return json({ error: 'Child account enablement must be true or false.' }, 400);
        enabled = body.enabled;
      }
      if (!firstName || firstName.length > 80 || !surname || surname.length > 80) return json({ error: 'Enter the child’s first name and surname.' }, 400);
      const age = ageOnDate(dateOfBirth);
      if (age === null || age >= 18) return json({ error: 'A child account must have a valid date of birth for someone under 18.' }, 400);
      if (!SCHOOL_YEARS.slice(0, 8).includes(schoolYear)) return json({ error: 'Choose a school year from Year 6 to Year 13.' }, 400);
      if (!allowedEntitlementList(requested)) return json({ error: 'One or more workbook requests are invalid.' }, 400);
      const isActive = Boolean(enabled && child.admin_enabled && child.parent_id);
      const requestStatus = child.approval_status === 'approved' && !sameEntitlements(requested, parseEntitlements(child.entitlements)) ? 'pending' : 'none';
      await env.DB.prepare('UPDATE users SET first_name=?, surname=?, date_of_birth=?, school_year=?, requested_entitlements=?, access_request_status=?, parent_enabled=?, active=? WHERE id=? AND parent_id=?')
        .bind(firstName, surname, dateOfBirth, schoolYear, JSON.stringify([...new Set(requested)]), requestStatus, enabled ? 1 : 0, isActive ? 1 : 0, child.id, parentAuth.user.id).run();
      const updated = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(child.id).first();
      return json({ child: parentChild(updated) });
    }
    if (childMatch && request.method === 'DELETE') {
      const result = await env.DB.prepare("DELETE FROM users WHERE id=? AND parent_id=? AND account_type='child'").bind(childMatch[1], parentAuth.user.id).run();
      return result.meta.changes ? json({ ok: true }) : json({ error: 'Child account not found.' }, 404);
    }
    const childPasswordMatch = pathname.match(/^\/api\/parent\/children\/([0-9a-f-]+)\/password$/i);
    if (childPasswordMatch && request.method === 'POST') {
      let body;
      try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
      if (!body || !validPassword(body.password)) return json({ error: 'Password must be at least 12 characters.' }, 400);
      const child = await env.DB.prepare("SELECT id FROM users WHERE id=? AND parent_id=? AND account_type='child'").bind(childPasswordMatch[1], parentAuth.user.id).first();
      if (!child) return json({ error: 'Child account not found.' }, 404);
      const salt = randomHex(16); const passwordHash = await derivePassword(body.password, salt);
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET password_salt=?, password_hash=? WHERE id=?').bind(salt, passwordHash, child.id),
        env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(child.id)
      ]);
      return json({ ok: true });
    }
    return json({ error: 'Parent endpoint not found.' }, 404);
  }

  if (pathname === '/api/auth/me' && request.method === 'GET') {
    const auth = await getAuth(request, env);
    return json(auth
      ? { authenticated: true, user: auth.user, allowedWorkbooks: userEntitlements(auth.user) }
      : { authenticated: false });
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Request body must be an object.' }, 400);
    const usernameInput = String(body.username || '').trim();
    const usernameKey = usernameInput.toLowerCase().slice(0, 64);
    const address = (request.headers.get('CF-Connecting-IP') || 'unknown').slice(0, 80);
    const usernameAttemptKey = `username:${address}:${usernameKey}`;
    const ipAttemptKey = `ip:${address}`;
    const [usernameState, ipState] = await Promise.all([
      consumeLoginAttempt(env, usernameAttemptKey, 5, now),
      consumeLoginAttempt(env, ipAttemptKey, 30, now)
    ]);
    if (usernameState.blocked_until > now || ipState.blocked_until > now) {
      return json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, 429);
    }

    const userRow = await env.DB.prepare('SELECT * FROM users WHERE username_key = ? AND active = 1').bind(usernameKey).first();
    if (typeof body.password !== 'string' || body.password.length > 256) {
      return json({ error: 'Username or password is incorrect.' }, 401);
    }
    const password = body.password;
    const salt = userRow ? userRow.password_salt : '6d6174682d61636164656d792d6c6f67696e2d73616c74';
    const actualHash = await derivePassword(password, salt);
    const matched = Boolean(userRow && equalHex(actualHash, userRow.password_hash));
    if (!matched) {
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
    const result = await env.DB.prepare("SELECT * FROM users ORDER BY CASE WHEN approval_status='pending' OR access_request_status='pending' THEN 0 ELSE 1 END, username_key").all();
    return json({ users: (result.results || []).map(adminUser) });
  }
  if (pathname === '/api/admin/progress' && request.method === 'GET') {
    const result = await env.DB.prepare(
      `SELECT c.id, c.username, c.first_name, c.surname, c.school_year, c.parent_id,
        COALESCE(NULLIF(trim(p.first_name || ' ' || p.surname), ''), p.username, 'Unassigned') AS parent_name,
        s.session_id, s.workbook_key, s.module_key, s.module_title, s.total_questions, s.completed_questions,
        s.error_count, s.elapsed_seconds, s.stars, s.topics_json, s.last_activity
       FROM users c LEFT JOIN users p ON p.id=c.parent_id AND p.account_type='parent'
       LEFT JOIN progress_sessions s ON s.user_id=c.id WHERE c.account_type='child'
       ORDER BY parent_name, c.username, s.last_activity DESC LIMIT 5000`
    ).all();
    const children = new Map();
    for (const row of result.results || []) {
      if (!children.has(row.id)) children.set(row.id, { id: row.id, username: row.username, firstName: row.first_name || '', surname: row.surname || '', schoolYear: row.school_year || '', parentId: row.parent_id || '', parentName: row.parent_name, sessions: [] });
      if (row.session_id) children.get(row.id).sessions.push(progressSession(row));
    }
    return json({ children: [...children.values()] });
  }

  const receiptMatch = pathname.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)\/receipt-email$/i);
  if (receiptMatch && request.method === 'POST') {
    const row = await env.DB.prepare("SELECT * FROM users WHERE id=? AND role='student' AND account_type='parent' AND approval_status='pending'").bind(receiptMatch[1]).first();
    if (!row) return json({ error: 'Pending parent registration not found.' }, 404);
    const email = (row.email || '').trim().toLowerCase();
    if (!email) return json({ error: 'This parent account has no email address.' }, 400);
    try { await sendEmail(env, email, notificationEmail('parent-pending', row)); }
    catch (error) { return json({ error: error.message }, 502); }
    return json({ ok: true });
  }

  const approvalMatch = pathname.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)\/approve$/i);
  if (approvalMatch && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || !allowedEntitlementList(body.entitlements)) return json({ error: 'Select valid workbook access.' }, 400);
    const pending = await env.DB.prepare("SELECT account_type, parent_id, parent_enabled, admin_enabled, active, approval_status, access_request_status FROM users WHERE id=? AND role='student'").bind(approvalMatch[1]).first();
    if (!pending || (pending.approval_status !== 'pending' && pending.access_request_status !== 'pending')) return json({ error: 'This registration or access request is no longer pending.' }, 409);
    if (pending.account_type === 'child' && !pending.parent_id) return json({ error: 'Link this child account to an approved parent before approval.' }, 400);
    const isNewApproval = pending.approval_status === 'pending';
    if (pending.account_type !== 'parent' && isNewApproval && !body.entitlements.length) return json({ error: 'Select at least one workbook to grant.' }, 400);
    const active = isNewApproval ? Boolean(pending.parent_enabled && pending.admin_enabled) : Boolean(pending.active);
    const update = await env.DB.prepare("UPDATE users SET active=?, approval_status='approved', entitlements=?, requested_entitlements=?, access_request_status='none' WHERE id=? AND role='student' AND (approval_status='pending' OR access_request_status='pending')")
      .bind(active ? 1 : 0, JSON.stringify([...new Set(body.entitlements)]), JSON.stringify([...new Set(body.entitlements)]), approvalMatch[1]).run();
    if (!update.meta.changes) return json({ error: 'This registration is no longer pending.' }, 409);
    const row = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(approvalMatch[1]).first();
    const profile = { ...row, firstName: row.first_name, parentEmail: row.parent_email };
    try { await sendToApplicantAndGuardian(env, profile, notificationEmail('approved', profile, url.origin)); }
    catch (error) { return json({ error: `Access was approved, but the notification could not be confirmed. One or more recipients may already have received it. Use Send approval email to retry. ${error.message}` }, 502); }
    return json({ user: adminUser(row) });
  }

  const rejectMatch = pathname.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)$/i);
  if (rejectMatch && request.method === 'DELETE') {
    const result = await env.DB.prepare("DELETE FROM users WHERE id=? AND approval_status='pending' AND role='student'").bind(rejectMatch[1]).run();
    return result.meta.changes ? json({ ok: true }) : json({ error: 'This registration is no longer pending.' }, 409);
  }

  const rejectAccessMatch = pathname.match(/^\/api\/admin\/registrations\/([0-9a-f-]+)\/reject-access$/i);
  if (rejectAccessMatch && request.method === 'POST') {
    const target = await env.DB.prepare("SELECT entitlements FROM users WHERE id=? AND role='student' AND approval_status='approved' AND access_request_status='pending'").bind(rejectAccessMatch[1]).first();
    if (!target) return json({ error: 'This access request is no longer pending.' }, 409);
    const result = await env.DB.prepare("UPDATE users SET requested_entitlements=entitlements, access_request_status='none' WHERE id=? AND role='student' AND approval_status='approved' AND access_request_status='pending'").bind(rejectAccessMatch[1]).run();
    return result.meta.changes ? json({ ok: true }) : json({ error: 'This access request is no longer pending.' }, 409);
  }

  const approvalEmailMatch = pathname.match(/^\/api\/admin\/users\/([0-9a-f-]+)\/approval-email$/i);
  if (approvalEmailMatch && request.method === 'POST') {
    const row = await env.DB.prepare("SELECT * FROM users WHERE id=? AND approval_status='approved' AND active=1").bind(approvalEmailMatch[1]).first();
    if (!row) return json({ error: 'Approved account not found.' }, 404);
    const profile = { ...row, firstName: row.first_name, parentEmail: row.parent_email };
    try { await sendToApplicantAndGuardian(env, profile, notificationEmail('approved', profile, url.origin)); }
    catch (error) { return json({ error: error.message }, 502); }
    return json({ ok: true });
  }

  if (pathname === '/api/admin/users' && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Request body must be an object.' }, 400);
    const username = String(body.username || '').trim();
    const role = body.role;
    if (!['admin', 'parent'].includes(role)) return json({ error: 'Choose administrator or parent account. Child accounts must be created by a parent.' }, 400);
    const entitlements = body.entitlements || [];
    if (!validUsername(username)) return json({ error: 'Username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.' }, 400);
    const hasInvitation = typeof body.email === 'string' && body.email.trim();
    if (hasInvitation && !validEmail(body.email)) return json({ error: 'Enter a valid email address.' }, 400);
    if (role === 'admin' && hasInvitation && (typeof body.firstName !== 'string' || !body.firstName.trim() || typeof body.surname !== 'string' || !body.surname.trim())) return json({ error: 'Enter the administrator’s first name and surname.' }, 400);
    const initialPassword = body.password || (hasInvitation ? randomHex(24) : '');
    if (!validPassword(initialPassword)) return json({ error: 'Password must be at least 12 characters.' }, 400);
    if (role === 'parent') {
      if (typeof body.firstName !== 'string' || !body.firstName.trim() || body.firstName.trim().length > 80 || typeof body.surname !== 'string' || !body.surname.trim() || body.surname.trim().length > 80 ||
          typeof body.address !== 'string' || !body.address.trim() || body.address.trim().length > 500 || !validEmail(body.email)) return json({ error: 'Enter valid parent name, email, and address details.' }, 400);
      const age = ageOnDate(body.dateOfBirth);
      if (age === null || age < 18) return json({ error: 'Parent accounts must belong to an adult aged 18 or over.' }, 400);
    }
    if (role === 'parent' && (!Array.isArray(entitlements) || entitlements.length)) return json({ error: 'Parent accounts do not receive workbook access.' }, 400);
    if (role === 'admin' && entitlements.length) return json({ error: 'Administrator access is managed by role.' }, 400);
    const salt = randomHex(16);
    const passwordHash = await derivePassword(initialPassword, salt);
    const id = crypto.randomUUID();
    try {
      await env.DB.prepare(
        `INSERT INTO users (id, username, username_key, role, account_type, active, parent_enabled, admin_enabled, approval_status, entitlements,
          password_salt, password_hash, created_at, first_name, surname, email, email_key, date_of_birth, address)
         VALUES (?, ?, lower(?), ?, ?, 1, 1, 1, 'approved', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, username, username, role === 'admin' ? 'admin' : 'student', role, JSON.stringify(role === 'admin' ? Object.keys(WORKBOOKS) : []), salt, passwordHash, now,
        body.firstName ? body.firstName.trim() : '', body.surname ? body.surname.trim() : '', hasInvitation ? body.email.trim().toLowerCase() : '', hasInvitation ? body.email.trim().toLowerCase() : '', role === 'parent' ? body.dateOfBirth : '', role === 'parent' ? body.address.trim() : '').run();
    } catch (error) {
      if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'That username or email address is already in use.' }, 409);
      throw error;
    }
    const created = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    if (hasInvitation) {
      try { await sendAccountInvitation(env, { ...created, firstName: created.first_name, role }, url.origin); }
      catch (error) {
        console.error('Administrator-created account invitation could not be sent:', error.message);
        return json({ user: publicUser(created), emailSent: false, message: `Account created, but ${error.message} Use Resend setup emails after checking email configuration.` }, 201);
      }
      return json({ user: publicUser(created), emailSent: true }, 201);
    }
    return json({ user: publicUser(created) }, 201);
  }

  const invitationMatch = pathname.match(/^\/api\/admin\/users\/([0-9a-f-]+)\/invitation-email$/i);
  if (invitationMatch && request.method === 'POST') {
    const row = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND role IN ('admin','student') AND account_type IN ('admin','parent')").bind(invitationMatch[1]).first();
    if (!row || !row.email) return json({ error: 'Administrator or parent account with an email address not found.' }, 404);
    try { await sendAccountInvitation(env, { ...row, firstName: row.first_name, role: row.account_type }, url.origin); }
    catch (error) { return json({ error: error.message }, 502); }
    return json({ ok: true });
  }

  const passwordMatch = pathname.match(/^\/api\/admin\/users\/([0-9a-f-]+)\/password$/i);
  if (passwordMatch && request.method === 'POST') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Request body must be an object.' }, 400);
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
  if (userMatch && request.method === 'DELETE') {
    const result = await env.DB.prepare(
      `DELETE FROM users WHERE id = ? AND (role != 'admin' OR active = 0 OR
        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND active = 1) > 1)`
    ).bind(userMatch[1]).run();
    if (!result.meta.changes) {
      const target = await env.DB.prepare('SELECT id FROM users WHERE id=?').bind(userMatch[1]).first();
      return target ? json({ error: 'Keep at least one active administrator.' }, 400) : json({ error: 'User not found.' }, 404);
    }
    return json({ ok: true });
  }
  if (userMatch && request.method === 'PATCH') {
    let body;
    try { body = await readJson(request); } catch (error) { return json({ error: error.message }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Request body must be an object.' }, 400);
    const target = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userMatch[1]).first();
    if (!target) return json({ error: 'User not found.' }, 404);
    let username = target.username;
    let entitlements;
    let active = Boolean(target.active);
    let adminEnabled = Boolean(target.admin_enabled);
    let email = target.email || '';
    let parentId = target.parent_id || '';
    let parentName = target.parent_name || '';
    let parentEmail = target.parent_email || '';
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
      adminEnabled = body.active;
      active = Boolean(body.active && target.parent_enabled && target.approval_status === 'approved');
    }
    if (body.parentId !== undefined) {
      if (target.account_type !== 'child') return json({ error: 'Only child accounts can be linked to a parent.' }, 400);
      if (body.parentId !== null && (typeof body.parentId !== 'string' || !body.parentId)) return json({ error: 'Choose a valid parent account or leave the child unassigned.' }, 400);
      if (body.parentId) {
        const parent = await env.DB.prepare("SELECT id, first_name, surname, email FROM users WHERE id=? AND account_type='parent' AND active=1 AND approval_status='approved'").bind(body.parentId).first();
        if (!parent) return json({ error: 'Choose an approved parent account.' }, 400);
        parentName = `${parent.first_name || ''} ${parent.surname || ''}`.trim();
        parentEmail = parent.email || '';
      }
      parentId = body.parentId || '';
      if (!parentId) { active = false; parentName = ''; parentEmail = ''; }
    }
    if (body.email !== undefined) {
      if (!validEmail(body.email)) return json({ error: 'Enter a valid email address.' }, 400);
      email = body.email.trim().toLowerCase();
      const emailTaken = await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? AND id != ? LIMIT 1').bind(email, target.id).first();
      if (emailTaken) return json({ error: 'That email address is already used by another account.' }, 409);
    }
    try {
      const update = await env.DB.prepare(
        `UPDATE users SET username = ?, username_key = lower(?), entitlements = ?, active = ?, admin_enabled = ?, email = ?, email_key = lower(?), parent_id = ?, parent_name = ?, parent_email = ?
          WHERE id = ? AND (? = 1 OR role != 'admin' OR active = 0 OR
            (SELECT COUNT(*) FROM users WHERE role = 'admin' AND active = 1) > 1)`
      ).bind(username, username, JSON.stringify(entitlements), active ? 1 : 0, adminEnabled ? 1 : 0, email, email, parentId || null, parentName, parentEmail, target.id, active ? 1 : 0).run();
      if (!active && target.role === 'admin' && !update.meta.changes) {
        return json({ error: 'Keep at least one active administrator.' }, 400);
      }
    } catch (error) {
      if (String(error.message).toLowerCase().includes('unique')) return json({ error: 'That username or email address is already in use.' }, 409);
      throw error;
    }
    if (!active) await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
    const updated = await env.DB.prepare('SELECT id, username, role, active, entitlements FROM users WHERE id = ?').bind(target.id).first();
    return json({ user: publicUser(updated) });
  }

  return json({ error: 'Admin endpoint not found.' }, 404);
}

function workbooksForPath(pathname) {
  return Object.entries(WORKBOOKS).filter(([, workbook]) => {
    const pageAlias = workbook.page.slice(0, -'.html'.length);
    return pathname === workbook.page || pathname === pageAlias || [workbook.script, workbook.engine, workbook.loader].includes(pathname);
  });
}

async function serveAsset(request, env, cacheControl, assetPath) {
  const assetRequest = assetPath ? new Request(new URL(assetPath, request.url), request) : request;
  const response = await env.ASSETS.fetch(assetRequest);
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);
  return secure(new Response(response.body, { status: response.status, statusText: response.statusText, headers }));
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.startsWith('/api/')) {
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, PATCH, DELETE' });
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
  if (PUBLIC_ASSETS.has(path)) {
    const assetPath = path === '/' ? '/index.html' : undefined;
    return serveAsset(request, env, 'public, max-age=300', assetPath);
  }
  const auth = await getAuth(request, env);

  if (ADMIN_ASSETS.has(path)) {
    if (!auth || auth.user.role !== 'admin') return secure(text(auth ? 'Administrator access required.' : 'Please sign in as an administrator.', auth ? 403 : 401));
    return serveAsset(request, env, 'private, no-store', ADMIN_ASSETS.get(path));
  }

  if (ACCOUNT_ASSETS.has(path)) {
    if (!auth) return secure(text('Sign in is required.', 401));
    if (auth.user.accountType === 'child') return secure(text('Child account profiles are managed by a parent or guardian.', 403));
    return serveAsset(request, env, 'private, no-store', ACCOUNT_ASSETS.get(path));
  }

  if (PARENT_ASSETS.has(path)) {
    if (!auth) return secure(text('Sign in is required.', 401));
    if (auth.user.accountType !== 'parent') return secure(text('Parent or guardian access is required.', 403));
    return serveAsset(request, env, 'private, no-store', PARENT_ASSETS.get(path));
  }

  const matchingWorkbooks = workbooksForPath(path);
  if (matchingWorkbooks.length) {
    const allowed = auth && (auth.user.role === 'admin' || matchingWorkbooks.some(([key]) => auth.user.entitlements.includes(key)));
    if (!allowed) return secure(text(auth ? 'This account does not have access to this workbook.' : 'Sign in is required.', auth ? 403 : 401));
    const pageMatch = matchingWorkbooks.find(([, workbook]) => path === workbook.page || path === workbook.page.slice(0, -'.html'.length));
    const scriptMatch = matchingWorkbooks.find(([, workbook]) => path === workbook.script);
    const engineMatch = matchingWorkbooks.find(([, workbook]) => path === workbook.engine);
    const loaderMatch = matchingWorkbooks.find(([, workbook]) => path === workbook.loader);
    const assetPath = pageMatch ? '/' + pageMatch[1].file : scriptMatch ? scriptMatch[1].script : engineMatch ? engineMatch[1].engine : loaderMatch[1].loader;
    return serveAsset(request, env, 'private, no-store', assetPath);
  }

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
