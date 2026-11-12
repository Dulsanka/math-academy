import test from 'node:test';
import assert from 'node:assert/strict';
import WORKBOOKS from '../src/workbooks.mjs';
import { ageOnDate, notificationEmail, validateRegistration } from '../src/account-support.mjs';

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
});
