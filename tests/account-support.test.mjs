import test from 'node:test';
import assert from 'node:assert/strict';
import WORKBOOKS from '../src/workbooks.mjs';
import { accountSetupLinkExpiry, ageOnDate, notificationEmail, normalizeProgressSummary, sendToApplicantAndGuardian, validateParentRegistration, validateRegistration } from '../src/account-support.mjs';

const application = {
  firstName: 'Aroha', surname: 'Learner', email: 'aroha@example.test', dateOfBirth: '2012-05-02', address: '1 Learning Road',
  schoolYear: 'Year 8', username: 'aroha_learner', password: 'Aroha-long-passphrase-2026', requestedEntitlements: ['year8'],
  parentName: 'Parent Learner', parentEmail: 'parent@example.test', privacyAcknowledged: true
};

test('registration validation requires parent details for under-18 applications and valid workbook choices', () => {
  assert.equal(validateRegistration(application, WORKBOOKS), null);
  assert.match(validateRegistration({ ...application, parentEmail: '' }, WORKBOOKS), /parent or guardian/i);
  assert.match(validateRegistration({ ...application, requestedEntitlements: ['administrator'] }, WORKBOOKS), /workbook access/i);
  assert.match(validateRegistration({ ...application, dateOfBirth: '2030-01-01' }, WORKBOOKS), /date of birth/i);
  assert.equal(ageOnDate('2000-01-01', new Date('2026-01-01T00:00:00Z')), 26);
});

test('notification templates escape user data and provide expected destinations', () => {
  const mail = notificationEmail('pending', { firstName: '<script>alert(1)</script>' });
  assert.doesNotMatch(mail.html, /<script>/);
  assert.match(mail.html, /&lt;script&gt;/);
  assert.equal(notificationEmail('approved', { firstName: 'Aroha' }, 'https://example.test/').subject, 'Your Math Academy access has been approved');
  const parentReceipt = notificationEmail('parent-pending', { firstName: 'Mere' });
  assert.match(parentReceipt.html, /children can sign in/);
  assert.match(parentReceipt.text, /Children can sign in/);
  const parentApproval = notificationEmail('approved', { account_type: 'parent', firstName: 'Mere' }, 'https://example.test/');
  assert.match(parentApproval.html, /Parent Portal/);
  const childApproval = notificationEmail('approved', { account_type: 'child', firstName: 'Ari' }, 'https://example.test/');
  assert.match(childApproval.text, /workbook access are approved/);
});

test('account setup links use role-specific expiry and explain it in onboarding mail', () => {
  assert.deepEqual(accountSetupLinkExpiry({ role: 'admin' }), { expiresInMs: 24 * 60 * 60 * 1000, label: '24 hours' });
  assert.deepEqual(accountSetupLinkExpiry({ accountType: 'parent' }), { expiresInMs: 30 * 60 * 1000, label: '30 minutes' });
  assert.match(notificationEmail('account-password-setup', { role: 'admin', setupExpiryLabel: '24 hours' }, 'https://example.test/reset').text, /expires in 24 hours/);
});

test('approval mail delivery fails clearly when an account has no recipient address', async () => {
  await assert.rejects(sendToApplicantAndGuardian({}, { username: 'orphan_child' }, notificationEmail('approved', { username: 'orphan_child' }, 'https://example.test/'), 'approval-orphan'), /no notification email address/i);
});

test('parent registration accepts adults and rejects underage applicants', () => {
  const parent = { firstName: 'Mere', surname: 'Parent', email: 'mere@example.test', dateOfBirth: '1985-05-02', address: '1 Family Road, New Zealand', username: 'mere_parent', password: 'Mere-long-parent-passphrase-2026', children: [{ firstName: 'Ari', surname: 'Parent', dateOfBirth: '2015-01-01', schoolYear: 'Year 6', username: 'ari_parent', password: 'Ari-child-passphrase-2026', requestedEntitlements: ['year6'] }] };
  assert.equal(validateParentRegistration(parent, WORKBOOKS), null);
  assert.match(validateParentRegistration({ ...parent, dateOfBirth: '2012-05-02' }), /adult aged 18/i);
  assert.match(validateParentRegistration({ ...parent, email: 'not-an-email' }), /valid email/i);
  assert.match(validateParentRegistration({ ...parent, children: [] }, WORKBOOKS), /between 1 and 5 children/i);
  assert.match(validateParentRegistration({ ...parent, children: [{ ...parent.children[0], dateOfBirth: '2000-01-01' }] }, WORKBOOKS), /under 18/i);
});

test('progress summary accepts bounded topic summaries and rejects invalid values', () => {
  const summary = { workbookKey: 'year6', sessionId: 'session-12345678', moduleKey: 'number', title: 'Number', totalQuestions: 10, completedQuestions: 4, errorCount: 2, elapsedSeconds: 300, stars: 1, topics: [{ name: 'Fractions', totalQuestions: 5, completedQuestions: 2, errorCount: 1 }] };
  assert.deepEqual(normalizeProgressSummary(summary, WORKBOOKS), summary);
  assert.equal(normalizeProgressSummary({ ...summary, workbookKey: 'year99' }, WORKBOOKS), null);
  assert.equal(normalizeProgressSummary({ ...summary, completedQuestions: 11 }, WORKBOOKS), null);
  assert.equal(normalizeProgressSummary({ ...summary, topics: [{ ...summary.topics[0], totalQuestions: 0, completedQuestions: 1 }] }, WORKBOOKS), null);
});
