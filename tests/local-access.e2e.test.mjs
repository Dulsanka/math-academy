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
let adminCreatedParentId;
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
  assert.equal((await request('/register.html')).status, 404, 'public child registration page is disabled');
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
  const adminProfileUpdate = await request('/api/account', { method: 'PATCH', cookie: adminLogin.cookie, body: {
    firstName: 'Academy', surname: 'Administrator', email: 'new-admin@example.test', dateOfBirth: '', address: '', schoolYear: '', parentName: '', parentEmail: ''
  } });
  assert.equal(adminProfileUpdate.status, 200, 'admin profile saves without learner-only date, address, school year or guardian details');
  assert.equal((await adminProfileUpdate.json()).profile.firstName, 'Academy');
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
  const adminPage = await request('/admin.html', { cookie: adminLogin.cookie });
  assert.equal(adminPage.status, 200);
  const adminMarkup = await adminPage.text();
  assert.match(adminMarkup, /id="admin-sign-out"/);
  assert.match(adminMarkup, /data-admin-page="accounts"/);
  assert.doesNotMatch(adminMarkup, /Learning progress/);
  assert.equal((await request('/account.html', { cookie: adminLogin.cookie })).status, 200);
  assert.match(await (await request('/account.html', { cookie: adminLogin.cookie })).text(), /src="\/account\.js"/);
  assert.match(await (await request('/account.js', { cookie: adminLogin.cookie })).text(), /adminEmailPassword/);
  const addedAdmin = await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { username: 'qa_admin_two', password: 'Qa-second-admin-passphrase-4853', role: 'admin' } });
  assert.equal(addedAdmin.status, 201);
  assert.equal((await addedAdmin.json()).user.role, 'admin');
  const removedAdmin = await request('/api/admin/users/' + (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.username === 'qa_admin_two').id, { method: 'DELETE', cookie: adminLogin.cookie });
  assert.equal(removedAdmin.status, 200);
  const addedParent = await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { role: 'parent', username: 'qa_admin_parent', password: 'Qa-admin-parent-passphrase-4856', firstName: 'Managed', surname: 'Parent', email: 'managed-parent@example.test', dateOfBirth: '1985-02-01', address: '3 Parent Road' } });
  assert.equal(addedParent.status, 201, 'admin can create an approved parent account to own migrated children');
  const addedParentBody = await addedParent.json();
  adminCreatedParentId = addedParentBody.user.id;
  assert.equal(addedParentBody.emailSent, false, 'parent account remains created if welcome email delivery fails');
  assert.equal((await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.id === adminCreatedParentId).accountType, 'parent');
  assert.equal((await request('/api/admin/users/' + adminCreatedParentId + '/approval-email', { method: 'POST', cookie: adminLogin.cookie })).status, 502, 'welcome email retry reports provider configuration errors');
  const adminCreatedParentLogin = await signIn('qa_admin_parent', 'Qa-admin-parent-passphrase-4856');
  assert.equal(adminCreatedParentLogin.response.status, 200);
  const parentLogin = await signIn(PARENT_NAME, PARENT_PASSWORD);
  assert.equal(parentLogin.response.status, 200);
  const parentPage = await request('/parent.html', { cookie: parentLogin.cookie });
  assert.equal(parentPage.status, 200);
  const parentMarkup = await parentPage.text();
  assert.match(parentMarkup, /data-parent-page="dashboard"/);
  assert.match(parentMarkup, /data-parent-page="children"/);
  assert.match(parentMarkup, /data-parent-page="add-child"/);
  assert.match(parentMarkup, /src="\/parent\.js"/);
  assert.equal((await request('/parent.js', { cookie: parentLogin.cookie })).status, 200);
  const childCreated = await request('/api/parent/children', { method: 'POST', cookie: parentLogin.cookie, body: {
    firstName: 'Test', surname: 'Child', dateOfBirth: '2015-05-10', schoolYear: 'Year 6', username: 'qa_child',
    password: 'Qa-child-passphrase-4854', requestedEntitlements: ['year6']
  } });
  assert.equal(childCreated.status, 201);
  const child = (await childCreated.json()).child;
  assert.equal(child.approvalStatus, 'pending');
  assert.deepEqual(child.entitlements, [], 'parent requests do not grant workbook access');
  const pendingChildLogin = await signIn('qa_child', 'Qa-child-passphrase-4854');
  assert.equal(pendingChildLogin.response.status, 200, 'child can sign in with their own credentials immediately after registration');
  assert.equal((await request('/6_year6_nz_mathematics_workbook.html', { cookie: pendingChildLogin.cookie })).status, 403, 'requested workbooks stay locked until admin approval');
  assert.equal((await request('/api/parent/dashboard', { cookie: pendingChildLogin.cookie })).status, 403, 'a child cannot open a parent dashboard');
  assert.equal((await request('/parent.html', { cookie: pendingChildLogin.cookie })).status, 403, 'a child cannot open parent portal pages');
  assert.equal((await request('/api/parent/children/' + child.id, { method: 'PATCH', cookie: parentLogin.cookie, body: { requestedEntitlements: ['year6', 'year7'], enabled: true } })).status, 200);
  const pendingChild = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.id === child.id);
  assert.ok(pendingChild);
  assert.deepEqual(pendingChild.requestedEntitlements, ['year6', 'year7']);
  const approveChild = await request('/api/admin/registrations/' + child.id + '/approve', { method: 'POST', cookie: adminLogin.cookie, body: { entitlements: ['year6'] } });
  assert.equal(approveChild.status, 502, 'approval is saved but configured email is required to report completion');
  const childLogin = await signIn('qa_child', 'Qa-child-passphrase-4854');
  assert.equal(childLogin.response.status, 200);
  assert.equal((await request('/account.html', { cookie: childLogin.cookie })).status, 403, 'child cannot open a profile page');
  assert.equal((await request('/account.js', { cookie: childLogin.cookie })).status, 403, 'child cannot load profile controls');
  assert.equal((await request('/api/account', { cookie: childLogin.cookie })).status, 403, 'child cannot call profile APIs');
  assert.equal((await request('/6_year6_nz_mathematics_workbook.html', { cookie: childLogin.cookie })).status, 200);
  const progress = await request('/api/progress', { method: 'POST', cookie: childLogin.cookie, body: { workbookKey: 'year6', sessionId: 'qa-session-12345678', moduleKey: 'number', title: 'Number practice', totalQuestions: 10, completedQuestions: 6, errorCount: 2, elapsedSeconds: 420, stars: 3, topics: [{ name: 'Fractions', totalQuestions: 5, completedQuestions: 4, errorCount: 1 }, { name: 'Decimals', totalQuestions: 5, completedQuestions: 2, errorCount: 1 }] } });
  assert.equal(progress.status, 200, 'child progress summary is stored');
  const parentDashboard = await request('/api/parent/dashboard', { cookie: parentLogin.cookie });
  assert.equal((await parentDashboard.json()).children.find(item => item.id === child.id).sessions.length, 1);
  const otherParentDashboard = await request('/api/parent/dashboard', { cookie: approvedParent.cookie });
  assert.equal((await otherParentDashboard.json()).children.length, 0, 'parents cannot view another family’s progress');
  const adminProgress = await request('/api/admin/progress', { cookie: adminLogin.cookie });
  assert.equal((await adminProgress.json()).children.find(item => item.id === child.id).sessions.length, 1, 'admin can view all child progress');
  assert.equal((await request('/api/admin/users/' + child.id, { method: 'PATCH', cookie: adminLogin.cookie, body: { parentId: adminCreatedParentId } })).status, 200, 'admin can move an existing child to another approved parent');
  assert.equal((await (await request('/api/parent/dashboard', { cookie: parentLogin.cookie })).json()).children.length, 0, 'previous parent immediately loses access after reassignment');
  assert.equal((await (await request('/api/parent/dashboard', { cookie: adminCreatedParentLogin.cookie })).json()).children[0].sessions.length, 1, 'new parent sees the linked child progress');
  const originalParentId = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.username === PARENT_NAME).id;
  assert.equal((await request('/api/admin/users/' + child.id, { method: 'PATCH', cookie: adminLogin.cookie, body: { parentId: originalParentId } })).status, 200);
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
  assert.equal(registration.status, 403, 'public learner self-registration is disabled');
  assert.equal((await signIn('pending-user', 'Pending-user-passphrase-4872')).response.status, 401, 'failed email registration leaves no account behind');
  const familyRegistration = await request('/api/auth/register-parent', { method: 'POST', body: {
    firstName: 'Email', surname: 'Retry', email: 'email-retry@example.test', dateOfBirth: '1985-05-10', address: '2 Family Street, New Zealand',
    username: 'qa_email_parent', password: 'Email-parent-passphrase-4879', privacyAcknowledged: true,
    children: [{ firstName: 'Email', surname: 'Child', dateOfBirth: '2015-05-10', schoolYear: 'Year 6', username: 'qa_email_child', password: 'Email-child-passphrase-4880', requestedEntitlements: ['year6'] }]
  } });
  assert.equal(familyRegistration.status, 202, 'a mail outage keeps the submitted family registration instead of rolling it back');
  assert.equal((await familyRegistration.json()).emailSent, false);
  const persistedParent = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.username === 'qa_email_parent');
  const persistedChild = (await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.find(user => user.username === 'qa_email_child');
  assert.ok(persistedParent && persistedChild, 'parent and child rows remain available for review');
  assert.equal(persistedParent.active, false, 'parent sign-in remains pending admin approval');
  assert.equal(persistedChild.active, true, 'child can sign in with their own credentials');
  assert.equal((await signIn('qa_email_child', 'Email-child-passphrase-4880')).response.status, 200);
  assert.equal((await request('/api/admin/registrations/' + persistedParent.id + '/receipt-email', { method: 'POST', cookie: adminLogin.cookie })).status, 502, 'admin can retry the receipt and see a provider failure');
  assert.equal((await request('/api/admin/registrations/' + persistedParent.id, { method: 'DELETE', cookie: adminLogin.cookie })).status, 200, 'declining a family registration removes its child records too');
  assert.equal((await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json()).users.some(user => user.username === 'qa_email_child'), false);
  assert.equal((await request('/api/auth/forgot-password', { method: 'POST', body: { email: 'unknown@example.test' } })).status, 200);

  assert.equal((await request('/api/admin/users', { method: 'POST', cookie: adminLogin.cookie, body: { username: 'learner', password: 'Learner-passphrase-4938', entitlements: ['year12'] } })).status, 400, 'admins cannot create standalone learner profiles');

  const admins = await (await request('/api/admin/users', { cookie: adminLogin.cookie })).json();
  const admin = admins.users.find(user => user.role === 'admin');
  assert.ok(admin);
  const lastAdmin = await request('/api/admin/users/' + admin.id, { method: 'PATCH', cookie: adminLogin.cookie, body: { active: false } });
  assert.equal(lastAdmin.status, 400);

  const logout = await request('/api/auth/logout', { method: 'POST', cookie: childLogin.cookie });
  assert.equal(logout.status, 200);
  assert.equal((await (await request('/api/auth/me', { cookie: childLogin.cookie })).json()).authenticated, false);
});

