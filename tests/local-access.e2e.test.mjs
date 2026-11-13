import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import WORKBOOKS from '../src/workbooks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN_NAME = 'qa_admin';
const ADMIN_PASSWORD = 'Qa-admin-passphrase-4851';
const PARENT_NAME = 'qa_parent';
const PARENT_PASSWORD = 'Qa-parent-passphrase-4852';
const PENDING_PARENT_NAME = 'qa_pending_parent';
const PENDING_PARENT_PASSWORD = 'Qa-pending-parent-passphrase-4855';
let pendingParentId;
const scrypt = promisify(crypto.scrypt);
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
  const parentSalt = crypto.randomBytes(16).toString('hex');
  const parentHash = (await scrypt(PARENT_PASSWORD, parentSalt, 64)).toString('hex');
  const pendingParentSalt = crypto.randomBytes(16).toString('hex');
  const pendingParentHash = (await scrypt(PENDING_PARENT_PASSWORD, pendingParentSalt, 64)).toString('hex');
  pendingParentId = crypto.randomUUID();
  await fs.writeFile(path.join(dataDir, 'users.json'), JSON.stringify([{
    id: crypto.randomUUID(), username: PARENT_NAME, role: 'student', accountType: 'parent', active: true,
    approvalStatus: 'approved', entitlements: [], requestedEntitlements: [], parentEnabled: true, adminEnabled: true,
    firstName: 'Test', surname: 'Parent', email: 'parent@example.test', dateOfBirth: '1985-01-01', address: '1 Family Street, New Zealand',
    passwordSalt: parentSalt, passwordHash: parentHash, createdAt: new Date().toISOString()
  }, {
    id: pendingParentId, username: PENDING_PARENT_NAME, role: 'student', accountType: 'parent', active: false,
    approvalStatus: 'pending', entitlements: [], requestedEntitlements: [], parentEnabled: true, adminEnabled: true,
    firstName: 'Pending', surname: 'Parent', email: 'pending-parent@example.test', dateOfBirth: '1984-01-01', address: '2 Family Street, New Zealand',
    passwordSalt: pendingParentSalt, passwordHash: pendingParentHash, createdAt: new Date().toISOString()
  }]), { mode: 0o600 });
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
  const emailChange = await request('/api/account/email', { method: 'POST', cookie: adminLogin.cookie, body: { email: 'new-admin@example.test', currentPassword: ADMIN_PASSWORD } });
  assert.equal(emailChange.status, 200, 'administrator email change succeeds after password confirmation');
  assert.equal((await emailChange.json()).email, 'new-admin@example.test');
  assert.equal((await signIn(PENDING_PARENT_NAME, PENDING_PARENT_PASSWORD)).response.status, 401);
  const parentApproval = await request('/api/admin/registrations/' + pendingParentId + '/approve', { method: 'POST', cookie: adminLogin.cookie, body: { entitlements: [] } });
  assert.equal(parentApproval.status, 502, 'parent approval is saved but email configuration is required to report completion');
  const approvedParent = await signIn(PENDING_PARENT_NAME, PENDING_PARENT_PASSWORD);
  assert.equal(approvedParent.response.status, 200);
  assert.equal((await (await request('/api/auth/me', { cookie: approvedParent.cookie })).json()).user.accountType, 'parent');
  assert.equal((await request('/6_year6_nz_mathematics_workbook.html', { cookie: approvedParent.cookie })).status, 403, 'approved parent receives no workbook access by default');
  const parentEntitlement = await request('/api/admin/users/' + pendingParentId, { method: 'PATCH', cookie: adminLogin.cookie, body: { entitlements: ['year6'] } });
  assert.equal(parentEntitlement.status, 200);
  assert.equal((await request('/6_year6_nz_mathematics_workbook.html', { cookie: approvedParent.cookie })).status, 200, 'an administrator can grant workbook access to the parent account');
  const adminMe = await request('/api/auth/me', { cookie: adminLogin.cookie });
  assert.equal((await adminMe.json()).user.role, 'admin');
  assert.equal((await request('/admin.html', { cookie: adminLogin.cookie })).status, 200);
  const addedAdmin = await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { username: 'qa_admin_two', password: 'Qa-second-admin-passphrase-4853', role: 'admin' } });
  assert.equal(addedAdmin.status, 201);
  assert.equal((await addedAdmin.json()).user.role, 'admin');
  const removedAdmin = await request('/api/admin/users/' + (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.username === 'qa_admin_two').id, { method: 'DELETE', cookie: adminLogin.cookie });
  assert.equal(removedAdmin.status, 200);
  const parentLogin = await signIn(PARENT_NAME, PARENT_PASSWORD);
  assert.equal(parentLogin.response.status, 200);
  assert.equal((await request('/parent.html', { cookie: parentLogin.cookie })).status, 200);
  const childCreated = await request('/api/parent/children', { method: 'POST', cookie: parentLogin.cookie, body: {
    firstName: 'Test', surname: 'Child', dateOfBirth: '2015-05-10', schoolYear: 'Year 6', username: 'qa_child',
    password: 'Qa-child-passphrase-4854', requestedEntitlements: ['year6']
  } });
  assert.equal(childCreated.status, 201);
  const child = (await childCreated.json()).child;
  assert.equal(child.approvalStatus, 'pending');
  assert.deepEqual(child.entitlements, [], 'parent requests do not grant workbook access');
  assert.equal((await signIn('qa_child', 'Qa-child-passphrase-4854')).response.status, 401, 'child sign-in remains disabled until admin approval');
  assert.equal((await request('/api/parent/children/' + child.id, { method: 'PATCH', cookie: parentLogin.cookie, body: { requestedEntitlements: ['year6', 'year7'], enabled: true } })).status, 200);
  const pendingChild = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.id === child.id);
  assert.ok(pendingChild);
  assert.deepEqual(pendingChild.requestedEntitlements, ['year6', 'year7']);
  const approveChild = await request('/api/admin/registrations/' + child.id + '/approve', { method: 'POST', cookie: adminLogin.cookie, body: { entitlements: ['year6'] } });
  assert.equal(approveChild.status, 502, 'approval is saved but configured email is required to report completion');
  const childLogin = await signIn('qa_child', 'Qa-child-passphrase-4854');
  assert.equal(childLogin.response.status, 200);
  assert.equal((await request('/6_year6_nz_mathematics_workbook.html', { cookie: childLogin.cookie })).status, 200);
  assert.equal((await request('/7_year7_nz_mathematics_workbook.html', { cookie: childLogin.cookie })).status, 403);
  const requestMore = await request('/api/parent/children/' + child.id, { method: 'PATCH', cookie: parentLogin.cookie, body: { requestedEntitlements: ['year6', 'year7'], enabled: true } });
  assert.equal(requestMore.status, 200);
  assert.equal((await request('/api/parent/children/' + child.id, { method: 'PATCH', cookie: parentLogin.cookie, body: { entitlements: ['year13'] } })).status, 200);
  const accessRequest = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.id === child.id);
  assert.equal(accessRequest.accessRequestStatus, 'pending');
  assert.deepEqual(accessRequest.entitlements, ['year6'], 'parents cannot alter granted entitlements');
  assert.equal((await request('/api/admin/registrations/' + child.id + '/reject-access', { method: 'POST', cookie: adminLogin.cookie })).status, 200);
  assert.equal((await request('/7_year7_nz_mathematics_workbook.html', { cookie: childLogin.cookie })).status, 403, 'denying an access change leaves existing access unchanged');
  const requestAgain = await request('/api/parent/children/' + child.id, { method: 'PATCH', cookie: parentLogin.cookie, body: { requestedEntitlements: ['year6', 'year7'], enabled: true } });
  assert.equal(requestAgain.status, 200);
  const pendingAccess = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.id === child.id);
  assert.equal(pendingAccess.accessRequestStatus, 'pending');
  const approveAccess = await request('/api/admin/registrations/' + child.id + '/approve', { method: 'POST', cookie: adminLogin.cookie, body: { entitlements: ['year6', 'year7'] } });
  assert.equal(approveAccess.status, 502, 'access update is saved but email is not configured');
  assert.deepEqual((await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.id === child.id).entitlements, ['year6', 'year7']);
  assert.equal((await request('/7_year7_nz_mathematics_workbook.html', { cookie: childLogin.cookie })).status, 200, 'only the administrator approval adds the new workbook');
  assert.equal((await request('/api/parent/children/' + child.id, { method: 'DELETE', cookie: parentLogin.cookie })).status, 200);
  assert.equal((await signIn('qa_child', 'Qa-child-passphrase-4854')).response.status, 401);
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

