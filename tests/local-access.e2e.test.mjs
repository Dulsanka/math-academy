import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import WORKBOOKS from '../src/workbooks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_NAME = 'qa_admin';
const ADMIN_PASSWORD = 'Qa-admin-passphrase-4851';
let server;
let baseUrl;
let origin;
let dataDir;

async function unusedPort() {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const { port } = socket.address();
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return port;
}

async function request(route, { cookie, method = 'GET', body, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  if (cookie) requestHeaders.set('Cookie', cookie);
  if (method !== 'GET' && method !== 'HEAD') requestHeaders.set('Origin', origin);
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }
  return fetch(baseUrl + route, { method, headers: requestHeaders, body });
}

async function signIn(username, password) {
  const response = await request('/api/auth/login', { method: 'POST', body: { username, password } });
  const rawCookie = response.headers.get('set-cookie');
  return { response, cookie: rawCookie ? rawCookie.split(';', 1)[0] : '' };
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'math-academy-e2e-'));
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  origin = baseUrl;
  server = spawn(process.execPath, [path.join(ROOT, 'src/local-server.js')], {
    cwd: ROOT,
    env: { ...process.env, DATA_DIR: dataDir, PORT: String(port), HOST: '127.0.0.1', BOOTSTRAP_ADMIN_USERNAME: ADMIN_NAME, BOOTSTRAP_ADMIN_PASSWORD: ADMIN_PASSWORD },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  let stderr = '';
  server.stderr.on('data', chunk => { stderr += chunk.toString(); });
  server.on('exit', code => { if (code && code !== 0) stderr += `\nserver exited with code ${code}`; });
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Local server failed to start: ${stderr}`);
    try {
      const response = await fetch(baseUrl + '/');
      if (response.ok) return;
    } catch { /* Wait for the local server to bind its port. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server did not become ready: ${stderr}`);
});

after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([once(server, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
  }
  if (dataDir) {
    const safeTempRoot = path.resolve(os.tmpdir());
    const resolved = path.resolve(dataDir);
    assert.ok(resolved.startsWith(safeTempRoot + path.sep) && path.basename(resolved).startsWith('math-academy-e2e-'));
    await fs.rm(resolved, { recursive: true, force: true });
  }
});

test('end-to-end access, entitlements, administrator actions, and session lifecycle', async () => {
  const root = await request('/');
  assert.equal(root.status, 200);
  assert.match(root.headers.get('content-security-policy') || '', /default-src 'self'/);
  assert.match(await root.text(), /id="login-form"/);
  assert.equal((await request('/register.html')).status, 200);
  assert.equal((await request('/forgot-password.html')).status, 200);
  assert.equal((await request('/account.html')).status, 401);
  assert.equal((await request('/account.js')).status, 401);

  for (const page of ['/1_interactive_math_workbook.html', '/6_year6_nz_mathematics_workbook.html', '/8_year12_nz_mathematics_workbook.html', '/9_year13_nz_mathematics_workbook.html']) {
    const response = await request(page);
    assert.equal(response.status, 401, `anonymous access denied for ${page}`);
  }
  assert.equal((await request('/admin.html')).status, 401);
  assert.equal((await request('/api/admin/users')).status, 403);

  const badLogin = await signIn(ADMIN_NAME, 'incorrect-password');
  assert.equal(badLogin.response.status, 401);
  const adminLogin = await signIn(ADMIN_NAME, ADMIN_PASSWORD);
  assert.equal(adminLogin.response.status, 200);
  assert.ok(adminLogin.cookie);
  assert.match(adminLogin.response.headers.get('set-cookie') || '', /HttpOnly/);
  const adminMe = await request('/api/auth/me', { cookie: adminLogin.cookie });
  assert.equal((await adminMe.json()).user.role, 'admin');
  assert.equal((await request('/admin.html', { cookie: adminLogin.cookie })).status, 200);
  for (const workbook of Object.values(WORKBOOKS)) {
    assert.equal((await request(workbook.page, { cookie: adminLogin.cookie })).status, 200, `admin can open ${workbook.page}`);
    assert.equal((await request(workbook.page.slice(0, -'.html'.length), { cookie: adminLogin.cookie })).status, 200, `extensionless alias works for ${workbook.page}`);
    for (const asset of [workbook.script, workbook.engine, workbook.loader].filter(Boolean)) {
      assert.equal((await request(asset, { cookie: adminLogin.cookie })).status, 200, `admin can load ${asset}`);
    }
  }

  const invalidOrigin = await fetch(baseUrl + '/api/auth/logout', { method: 'POST', headers: { Origin: 'https://attacker.example' } });
  assert.equal(invalidOrigin.status, 403);

  const registration = await request('/api/auth/register', { method: 'POST', body: {
    firstName: 'Pending', surname: 'Applicant', email: 'pending@example.test', dateOfBirth: '1995-05-10', address: '1 Test Street',
    schoolYear: 'Adult / other', username: 'pending-user', password: 'Pending-user-passphrase-4872', requestedEntitlements: ['year6'], privacyAcknowledged: true
  } });
  assert.equal(registration.status, 503, 'email settings must be configured before claiming registration succeeded');
  assert.equal((await signIn('pending-user', 'Pending-user-passphrase-4872')).response.status, 401, 'failed email registration leaves no account behind');
  assert.equal((await request('/api/auth/forgot-password', { method: 'POST', body: { email: 'unknown@example.test' } })).status, 200);

  const tooShort = await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { username: 'learner', password: 'short', entitlements: ['year12'] } });
  assert.equal(tooShort.status, 400);
  const createdResponse = await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { username: 'learner', password: 'Learner-passphrase-4938', entitlements: ['year12'] } });
  assert.equal(createdResponse.status, 201);
  const learner = (await createdResponse.json()).user;
  assert.deepEqual(learner.entitlements, ['year12']);
  assert.equal((await request('/api/admin/users/' + learner.id, { method: 'PATCH', cookie: adminLogin.cookie, body: { email: 'learner@example.test' } })).status, 200);
  assert.equal((await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { username: 'LEARNER', password: 'Another-passphrase-3920', entitlements: [] } })).status, 409);

  const learnerLogin = await signIn('learner', 'Learner-passphrase-4938');
  assert.equal(learnerLogin.response.status, 200);
  const profileUpdate = await request('/api/account', { method: 'PATCH', cookie: learnerLogin.cookie, body: {
    firstName: 'Learner', surname: 'Example', email: 'learner@example.test', dateOfBirth: '1995-04-20', address: '10 Academy Road',
    schoolYear: 'Year 12', parentName: '', parentEmail: ''
  } });
  assert.equal(profileUpdate.status, 200);
  assert.equal((await (await request('/api/account', { cookie: learnerLogin.cookie })).json()).profile.address, '10 Academy Road');
  const learnerPage = await request('/8_year12_nz_mathematics_workbook.html', { cookie: learnerLogin.cookie });
  assert.equal(learnerPage.status, 200);
  assert.match(await learnerPage.text(), /workbook-loader\.js/);
  assert.equal((await request('/9_year13_nz_mathematics_workbook.html', { cookie: learnerLogin.cookie })).status, 403);
  assert.equal((await request('/assets/js/year13-curriculum.js', { cookie: learnerLogin.cookie })).status, 403);
  assert.equal((await request('/assets/js/year12-curriculum.js', { cookie: learnerLogin.cookie })).status, 200);
  assert.equal((await request('/api/admin/users', { cookie: learnerLogin.cookie })).status, 403);

  const updated = await request('/api/admin/users/' + learner.id, { method: 'PATCH', cookie: adminLogin.cookie, body: { entitlements: ['year13'], active: true } });
  assert.equal(updated.status, 200);
  assert.equal((await request('/9_year13_nz_mathematics_workbook.html', { cookie: learnerLogin.cookie })).status, 200);
  assert.equal((await request('/8_year12_nz_mathematics_workbook.html', { cookie: learnerLogin.cookie })).status, 403);

  const reset = await request('/api/admin/users/' + learner.id + '/password', { method: 'POST', cookie: adminLogin.cookie, body: { password: 'New-learner-passphrase-7402' } });
  assert.equal(reset.status, 200);
  assert.equal((await request('/api/auth/me', { cookie: learnerLogin.cookie })).status, 200);
  assert.equal((await (await request('/api/auth/me', { cookie: learnerLogin.cookie })).json()).authenticated, false);
  assert.equal((await signIn('learner', 'Learner-passphrase-4938')).response.status, 401);
  const resetLogin = await signIn('learner', 'New-learner-passphrase-7402');
  assert.equal(resetLogin.response.status, 200);
  const passwordChange = await request('/api/account/password', { method: 'POST', cookie: resetLogin.cookie, body: { currentPassword: 'New-learner-passphrase-7402', newPassword: 'Self-changed-passphrase-7035' } });
  assert.equal(passwordChange.status, 200);
  assert.equal((await request('/api/auth/me', { cookie: resetLogin.cookie })).status, 200, 'current user session remains active after password change');
  assert.equal((await signIn('learner', 'New-learner-passphrase-7402')).response.status, 401);
  const selfResetLogin = await signIn('learner', 'Self-changed-passphrase-7035');
  assert.equal(selfResetLogin.response.status, 200);

  const admins = await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json();
  const admin = admins.users.find(user => user.role === 'admin');
  assert.ok(admin);
  const lastAdmin = await request('/api/admin/users/' + admin.id, { method: 'PATCH', cookie: adminLogin.cookie, body: { active: false } });
  assert.equal(lastAdmin.status, 400);

  const logout = await request('/api/auth/logout', { method: 'POST', cookie: selfResetLogin.cookie });
  assert.equal(logout.status, 200);
  assert.equal((await (await request('/api/auth/me', { cookie: selfResetLogin.cookie })).json()).authenticated, false);
});

