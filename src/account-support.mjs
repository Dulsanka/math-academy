export const SCHOOL_YEARS = ['Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13', 'Adult / other'];

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ageOnDate(isoDate, today = new Date()) {
  if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const now = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (date > now) return null;
  let age = now.getUTCFullYear() - year;
  if (now.getUTCMonth() < month - 1 || (now.getUTCMonth() === month - 1 && now.getUTCDate() < day)) age -= 1;
  return age;
}

export function validateRegistration(body, workbooks) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Please complete the registration form.';
  const required = ['firstName', 'surname', 'address', 'schoolYear', 'username'];
  if (required.some((key) => typeof body[key] !== 'string' || !body[key].trim())) return 'Complete all required fields.';
  if (body.firstName.trim().length > 80 || body.surname.trim().length > 80 || body.address.trim().length > 500) return 'Some profile fields are too long.';
  if (!validEmail(body.email)) return 'Enter a valid email address.';
  if (!SCHOOL_YEARS.includes(body.schoolYear)) return 'Choose a valid school year.';
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(body.username.trim())) return 'Username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.';
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) return 'Choose a password with at least 12 characters.';
  if (!Array.isArray(body.requestedEntitlements) || !body.requestedEntitlements.length || !body.requestedEntitlements.every((entry) => Object.hasOwn(workbooks, entry))) return 'Choose at least one workbook access preference.';
  const age = ageOnDate(body.dateOfBirth);
  if (age === null) return 'Enter a valid date of birth that is not in the future.';
  if (age < 18 && (!body.parentName?.trim() || body.parentName.trim().length > 160 || !validEmail(body.parentEmail))) return 'A parent or guardian name and email are required for applicants under 18.';
  if (age >= 18 && (body.parentName || body.parentEmail)) return 'Parent or guardian details should only be entered for applicants under 18.';
  return null;
}

export function validateParentRegistration(body, workbooks = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Please complete the parent registration form.';
  if (['firstName', 'surname', 'address', 'username'].some((key) => typeof body[key] !== 'string' || !body[key].trim())) return 'Complete all required fields.';
  if (body.firstName.trim().length > 80 || body.surname.trim().length > 80 || body.address.trim().length > 500) return 'Some profile fields are too long.';
  if (!validEmail(body.email)) return 'Enter a valid email address.';
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(body.username.trim())) return 'Username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.';
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) return 'Choose a password with at least 12 characters.';
  const age = ageOnDate(body.dateOfBirth);
  if (age === null || age < 18) return 'Parent or guardian accounts must be registered by an adult aged 18 or over.';
  if (!Array.isArray(body.children) || body.children.length < 1 || body.children.length > 5) return 'Register between 1 and 5 children with your parent account.';
  const usernames = new Set([body.username.trim().toLowerCase()]);
  for (const child of body.children) {
    if (!child || typeof child !== 'object' || Array.isArray(child)) return 'Enter each child’s details.';
    if (['firstName', 'surname', 'schoolYear', 'username'].some((key) => typeof child[key] !== 'string' || !child[key].trim())) return 'Complete every child’s name, school year, and username.';
    if (child.firstName.trim().length > 80 || child.surname.trim().length > 80) return 'A child name is too long.';
    const childAge = ageOnDate(child.dateOfBirth);
    if (childAge === null || childAge >= 18) return 'Each child account must belong to someone under 18 with a valid date of birth.';
    if (!SCHOOL_YEARS.slice(0, 8).includes(child.schoolYear)) return 'Choose a school year from Year 6 to Year 13 for each child.';
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(child.username.trim())) return 'Each child username must be 3-32 characters using letters, numbers, dots, underscores or hyphens.';
    const childKey = child.username.trim().toLowerCase();
    if (usernames.has(childKey)) return 'Parent and child usernames must all be unique.';
    usernames.add(childKey);
    if (typeof child.password !== 'string' || child.password.length < 12 || child.password.length > 256) return 'Each child needs an initial password of at least 12 characters.';
    if (!Array.isArray(child.requestedEntitlements) || !child.requestedEntitlements.length || child.requestedEntitlements.length > Object.keys(workbooks).length || !child.requestedEntitlements.every((entry) => Object.hasOwn(workbooks, entry))) return 'Select one or more valid workbook years for each child.';
  }
  return null;
}

export function normalizeProgressSummary(body, workbooks = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.hasOwn(workbooks, body.workbookKey)) return null;
  if (typeof body.sessionId !== 'string' || !/^[a-zA-Z0-9._:-]{8,128}$/.test(body.sessionId)) return null;
  if (typeof body.moduleKey !== 'string' || !body.moduleKey.trim() || body.moduleKey.length > 120) return null;
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160) return null;
  const integerInRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  if (!integerInRange(body.totalQuestions, 1, 25) || !integerInRange(body.completedQuestions, 0, body.totalQuestions) ||
      !integerInRange(body.errorCount, 0, 1000) || !integerInRange(body.elapsedSeconds, 0, 604800) || !integerInRange(body.stars, 0, 1000000)) return null;
  if (!Array.isArray(body.topics) || !body.topics.length || body.topics.length > 25) return null;
  const topics = [];
  for (const item of body.topics) {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120 ||
        !integerInRange(item.totalQuestions, 0, 25) || !integerInRange(item.completedQuestions, 0, item.totalQuestions) || !integerInRange(item.errorCount, 0, 1000)) return null;
    topics.push({ name: item.name.trim(), totalQuestions: item.totalQuestions, completedQuestions: item.completedQuestions, errorCount: item.errorCount });
  }
  return {
    workbookKey: body.workbookKey, sessionId: body.sessionId, moduleKey: body.moduleKey.trim(), title: body.title.trim(),
    totalQuestions: body.totalQuestions, completedQuestions: body.completedQuestions, errorCount: body.errorCount,
    elapsedSeconds: body.elapsedSeconds, stars: body.stars, topics
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function notificationEmail(kind, profile, detail = '') {
  const name = escapeHtml(profile.firstName || profile.first_name || profile.username || 'learner');
  let subject;
  let message;
  let textMessage;
  if (kind === 'pending') {
    subject = 'Math Academy registration received';
    message = `<p>Hi ${name},</p><p>We received your NZ Mathematics Academy registration. Your requested workbook access is pending administrator review. We will email you again when a decision has been made.</p><p>If you are under 18, your parent or guardian will also receive an email when access is approved.</p>`;
    textMessage = 'Your registration and requested workbook access are pending administrator review.';
  } else if (kind === 'parent-pending') {
    subject = 'Family registration received — awaiting review';
    message = `<p>Hi ${name},</p><p>We received your family registration. Your parent or guardian account is pending administrator approval. The child profiles have been created, and children can sign in with the usernames and passwords you chose.</p><p>Children will not see or open workbook pages until an administrator approves the requested workbook access. You can manage child profiles after your parent account is approved.</p>`;
    textMessage = 'We received your family registration. Your parent account is pending administrator approval. Children can sign in with their credentials, but cannot open workbook pages until an administrator approves access.';
  } else if (kind === 'approved') {
    subject = 'Your Math Academy access has been approved';
    if (profile.account_type === 'parent' || profile.accountType === 'parent') {
      message = `<p>Congratulations, ${name}! Your parent or guardian account has been approved.</p><p>Sign in at <a href="${escapeHtml(detail)}">Math Academy</a> with your username to open the Parent Portal and manage your children.</p>`;
      textMessage = `Your parent or guardian account is approved. Sign in at ${detail} to open the Parent Portal.`;
    } else if (profile.account_type === 'child' || profile.accountType === 'child') {
      message = `<p>Congratulations, ${name}! An administrator has approved your account and workbook access.</p><p>Sign in at <a href="${escapeHtml(detail)}">Math Academy</a> with the username and password your parent or guardian gave you.</p>`;
      textMessage = `Your account and workbook access are approved. Sign in at ${detail} with your username and password.`;
    } else {
      message = `<p>Congratulations, ${name}! Your NZ Mathematics Academy account has been approved.</p><p>You can now sign in at <a href="${escapeHtml(detail)}">Math Academy</a> with the username you registered.</p>`;
      textMessage = `Your account is approved. Sign in at ${detail} with your username.`;
    }
  } else if (kind === 'account-username') {
    const accountLabel = profile.role === 'admin' ? 'administrator' : 'parent or guardian';
    subject = 'Your Math Academy account details';
    message = `<p>Hello ${name},</p><p>Your ${accountLabel} account has been created for NZ Mathematics Academy.</p><p>Your username is <strong>${escapeHtml(profile.username || '')}</strong>.</p><p>Open <a href="${escapeHtml(detail)}">Math Academy</a> after you set a password using the separate password setup email.</p>`;
    textMessage = `Your ${accountLabel} account has been created. Username: ${profile.username || ''}. Open ${detail} after setting a password using the separate setup email.`;
  } else if (kind === 'account-password-setup') {
    const expiryLabel = profile.setupExpiryLabel === '24 hours' ? '24 hours' : '30 minutes';
    subject = 'Set your Math Academy password';
    message = `<p>Hello ${name},</p><p>Use this one-time link to choose a password for your Math Academy account. It expires in ${expiryLabel} and can only be used once.</p><p><a href="${escapeHtml(detail)}">Set your password</a></p><p>If you did not expect this account, contact your academy administrator.</p>`;
    textMessage = `Use this one-time link to set your Math Academy password. It expires in ${expiryLabel}: ${detail}`;
  } else if (kind === 'reset') {
    subject = 'Reset your Math Academy password';
    message = `<p>Hello ${name},</p><p>Use the link below to choose a new password. The link expires in 30 minutes and can only be used once.</p><p><a href="${escapeHtml(detail)}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`;
    textMessage = `Use this link to reset your password (expires in 30 minutes): ${detail}`;
  } else {
    throw new Error('Unknown email template.');
  }
  return { subject, html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172554;line-height:1.6"><main style="max-width:600px;margin:auto;padding:28px"><h1 style="color:#2563eb">NZ Mathematics Academy</h1>${message}<p>— NZ Mathematics Academy</p></main></body></html>`, text: `${subject}\n\n${textMessage}` };
}

function base64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join('\r\n') || '';
}

function gmailRawMessage(from, to, email) {
  const boundary = `math-academy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const subject = `=?UTF-8?B?${base64Utf8(email.subject)}?=`;
  const body = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(base64Utf8(email.text)),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(base64Utf8(email.html)),
    `--${boundary}--`,
    ''
  ].join('\r\n');
  return base64Utf8(body).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function sendEmail(env, to, email) {
  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET;
  const refreshToken = env.GMAIL_REFRESH_TOKEN;
  const from = env.GMAIL_SENDER_EMAIL;
  if (!clientId || !clientSecret || !refreshToken || !from) throw new Error('Gmail API is not configured.');
  if (!validEmail(to) || !validEmail(from)) throw new Error('Gmail sender or recipient email address is invalid.');
  const recipient = to.trim();
  const sender = from.trim();

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' })
  });
  if (!tokenResponse.ok) {
    console.error('Gmail OAuth token refresh failed:', tokenResponse.status);
    throw new Error('Gmail authorization failed. Check the Google OAuth secrets and consent status.');
  }
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) throw new Error('Google did not return an access token. Re-authorize the Gmail account.');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: gmailRawMessage(sender, recipient, email) })
  });
  if (!response.ok) {
    console.error('Gmail API email delivery failed:', response.status);
    throw new Error('Gmail could not send the message. Check the Gmail API and sender configuration.');
  }
}

export async function sendToApplicantAndGuardian(env, profile, email) {
  const recipients = [...new Set([profile.email, profile.parentEmail || profile.parent_email].filter(Boolean).map((value) => value.trim().toLowerCase()))];
  if (!recipients.length) throw new Error('No notification email address is available for this account.');
  await Promise.all(recipients.map((recipient) => sendEmail(env, recipient, email)));
}
