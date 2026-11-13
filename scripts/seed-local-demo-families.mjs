import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_LOCAL_DEMO_SEED !== 'YES') {
  throw new Error('For safety, set ALLOW_LOCAL_DEMO_SEED=YES and run only against local development data.');
}

const scrypt = promisify(crypto.scrypt);
const dataDir = path.resolve(process.env.DATA_DIR || path.join(import.meta.dirname, '..', 'data'));
const userFile = path.join(dataDir, 'users.json');
const users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
const samplePassword = 'MathDemo2026!';
const timestamp = new Date().toISOString();
const parents = [
  { username: 'sample_parent_1', firstName: 'Alex', surname: 'Morgan', email: 'alex.morgan@example.test' },
  { username: 'sample_parent_2', firstName: 'Jamie', surname: 'Taylor', email: 'jamie.taylor@example.test' }
];

for (const profile of parents) {
  if (users.some((user) => user.username.toLowerCase() === profile.username)) throw new Error(`Sample account already exists: ${profile.username}`);
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = (await scrypt(samplePassword, salt, 64)).toString('hex');
  users.push({ id: crypto.randomUUID(), ...profile, role: 'student', accountType: 'parent', parentId: null, active: true, adminEnabled: true,
    parentEnabled: true, approvalStatus: 'approved', entitlements: [], requestedEntitlements: [], dateOfBirth: '1985-01-01', address: 'Sample address, New Zealand',
    schoolYear: '', parentName: '', parentEmail: '', passwordSalt: salt, passwordHash, createdAt: timestamp });
}

const sampleParents = parents.map((profile) => users.find((user) => user.username === profile.username));
const legacyLearners = users.filter((user) => user.role === 'student' && !user.parentId &&
  (user.accountType === 'child' || (user.accountType !== 'parent' && user.accountType !== 'admin' && /^test/i.test(user.username))));
for (let index = 0; index < legacyLearners.length; index += 1) {
  const child = legacyLearners[index];
  const parent = sampleParents[index % sampleParents.length];
  const salt = crypto.randomBytes(16).toString('hex');
  child.accountType = 'child'; child.parentId = parent.id; child.parentEnabled = true; child.adminEnabled = true;
  child.approvalStatus = 'approved'; child.active = true; child.dateOfBirth ||= '2014-01-01'; child.schoolYear ||= 'Year 7';
  child.firstName ||= `Sample child ${index + 1}`; child.surname ||= parent.surname; child.email = ''; child.parentName = `${parent.firstName} ${parent.surname}`; child.parentEmail = parent.email;
  child.requestedEntitlements = [...(child.entitlements || [])]; child.passwordSalt = salt; child.passwordHash = (await scrypt(samplePassword, salt, 64)).toString('hex');
}

for (let index = 0; index < sampleParents.length; index += 1) {
  const parent = sampleParents[index];
  if (users.some((user) => user.accountType === 'child' && user.parentId === parent.id)) continue;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = (await scrypt(samplePassword, salt, 64)).toString('hex');
  const number = index + 1;
  users.push({ id: crypto.randomUUID(), username: `sample_child_${number}`, role: 'student', accountType: 'child', parentId: parent.id,
    firstName: `Sample child ${number}`, surname: parent.surname, email: '', parentName: `${parent.firstName} ${parent.surname}`, parentEmail: parent.email,
    dateOfBirth: `201${number}-01-01`, schoolYear: `Year ${number + 5}`, active: true, parentEnabled: true, adminEnabled: true, approvalStatus: 'approved',
    entitlements: [`year${number + 5}`], requestedEntitlements: [`year${number + 5}`], passwordSalt: salt, passwordHash, createdAt: timestamp });
}

fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const temporaryFile = userFile + '.tmp';
fs.writeFileSync(temporaryFile, JSON.stringify(users, null, 2), { mode: 0o600 });
fs.renameSync(temporaryFile, userFile);
console.log('Created three local sample parent accounts and linked sample child accounts.');
console.log(`Local-only shared sample password: ${samplePassword}`);
console.log('Do not use these sample accounts on the hosted site.');
