# NZ Interactive Mathematics Workbooks

A browser-based mathematics practice suite for New Zealand learners in Years 6-13, plus a foundational arithmetic workbook. The access service provides sign-in, per-user workbook entitlements, and administrator tools for managing accounts.

**Live application:** [Open Math Academy](https://math-academy.dulsanka-math-academy.workers.dev/)

## Project structure

```text
public/                    Browser pages and static assets deployed by Cloudflare
  index.html               Sign-in and workbook navigation
  register.html            Public learner registration and privacy notice
  parent-register.html     Public parent or guardian registration
  account.html             Signed-in user profile and password management
  parent.html              Approved parent child-account portal
  admin.html               Administrator-only account management
  workbooks/               Shared curriculum page and arithmetic page
  assets/css/              Site, admin, and workbook styles
  assets/js/               Login, workbook loader, and curriculum engines/data
src/                       Server-side entry points
  worker.js                Cloudflare API, sessions, entitlements, protected files
  local-server.js          Optional local Node.js access server
  account-support.mjs      Shared registration validation and email templates
  workbooks.mjs            Shared routes, files, scripts, and entitlements map
server.js                  Backward-compatible local start command
migrations/                D1 database schema changes
.github/workflows/         GitHub Actions deployment workflow
wrangler.toml              Cloudflare Worker, assets, and D1 configuration
```

The curriculum workbooks for Years 6-13 use one page layout in `public/workbooks/curriculum.html`. `public/assets/js/workbook-loader.js` selects the year’s curriculum code from the existing page URL. Years 6 and 7 share an engine and keep their curriculum data in separate protected files. Years 12 and 13 share a senior practice engine with separate curriculum data. The arithmetic workbook has its own page and engine.

The familiar workbook URLs remain the public routes. The Worker checks each route’s entitlement before serving its mapped file or curriculum script. Both server entry points use the shared route configuration in `src/workbooks.mjs`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for request flow and the steps for adding another curriculum year.

The workbooks include guided questions with immediate feedback, curriculum topics by strand, random practice, progress indicators, stars, streaks, timers, tutor mode, notes, a drawing pad, printable answer sheets, topic guides, a calculator, and browser-local progress recovery. Progress is saved in each learner's browser and does not sync between devices.

## Parent registration and email setup

Only a parent or guardian can register children. The parent registration form collects the adult's profile, one to five child profiles, login credentials, school years, and requested workbooks. Parent sign-in stays pending until administrator approval. Children can sign in with their own credentials once their family registration is saved, but workbook pages stay blocked until an administrator approves their requested entitlements. Administrators review the family in **Manage Users → Registrations awaiting approval**. Declining a pending parent deletes the family and its linked child profiles.

The receipt email is sent after the family records are saved. If the email provider is unavailable, the registration is kept and the form explains that delivery failed; an administrator can resend the receipt from the pending registration card. Approval also saves before notification delivery. If an approval email fails, the account remains approved and the administrator can use **Send approval email** to retry. Gmail does not guarantee deduplication if a retry follows an ambiguous delivery failure, so a duplicate message is possible. Configure email delivery before inviting families.

Parents can add and remove child profiles, reset child passwords, and enable or disable a child's sign-in. Parents can request workbook access, but only an administrator can grant workbook years. Administrators can create approved parent accounts and link legacy children from **Manage Users**. Admins can also create or remove administrators; the service prevents removal or deactivation of the last active administrator. Change the administrator recovery email in **My account → Update administrator email**, confirming with the current password.

Registration addresses have a country selector and use the browser's built-in address autofill where available. Google Places suggestions are not connected. Google currently offers free monthly usage caps for some Places requests, but enabling the Places API still requires a billing-enabled Google Cloud project and API key. Avoid adding it if you do not want to attach billing details; the standard address field and browser autofill need no Google key.

Transactional messages (family registration receipt, approval and password reset) use the Gmail API and the administrator's Google account. The app requests only the `gmail.send` scope. Google requires OAuth 2.0 and a refresh token for server-side sending; credentials must remain in Cloudflare Worker secrets, never in GitHub or project files. See [Gmail API sending](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send), [OAuth for server-side apps](https://developers.google.com/identity/protocols/oauth2/web-server), and [Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).

### Gmail API setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable **Gmail API**.
2. Configure the OAuth consent screen for an **External** app, add the Gmail account that will send the messages as a test user, and create an OAuth client of type **Web application**. Add this authorized redirect URI: `https://developers.google.com/oauthplayground`.
3. Copy the OAuth **Client ID** and **Client secret**. In [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/), open its settings (gear icon), enable **Use your own OAuth credentials**, and enter those values. In Step 1, request only `https://www.googleapis.com/auth/gmail.send`, authorize using the same Gmail account, and in Step 2 exchange the code for tokens. Copy the **refresh token**. The OAuth Playground revokes its default refresh tokens after 24 hours, so use your own OAuth client credentials as described here.
4. In Cloudflare, open **Workers & Pages → math-academy → Settings → Variables and Secrets** and add these exact names:
   - As **Secrets**: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN`.
   - As a **Text** variable: `GMAIL_SENDER_EMAIL`, containing the same Gmail address that authorized the OAuth request.
   - Select **Deploy** to apply the settings. GitHub Actions secrets used for deployments are separate and are not automatically available to the running Worker.
5. For local testing, set the same four environment variables in PowerShell before starting `node server.js`. Do not save actual credentials in source files.

With an **External** OAuth app left in **Testing**, a refresh token for the `gmail.send` scope expires after 7 days. Move the consent screen to **In production** for ongoing use; Google may require OAuth verification because `gmail.send` is a sensitive scope. If an email attempt fails, family registrations and approvals remain saved; an administrator can retry the registration receipt or approval email. A retry after an ambiguous network failure could send a duplicate.

If Gmail authorization expires or is revoked, create a new refresh token and update the Cloudflare secret. Password recovery responses intentionally do not reveal whether an email belongs to an account.

Registration collects a date of birth and home address because the current workflow requests them. The privacy notice explains why the application collects this information, who receives transactional messages, and that administrators can view the profile. Review your privacy notice, data retention needs, and obligations for child applicants before inviting real learners. Google processes the Gmail sender account and recipient addresses and message content to deliver these emails.

## Local use

For the existing Node.js local server, install Node.js 20 or later and run these commands in PowerShell from the project directory:

```powershell
$env:BOOTSTRAP_ADMIN_USERNAME = 'academy-admin'
$env:BOOTSTRAP_ADMIN_PASSWORD = 'use-a-long-unique-passphrase-here'
$env:DATA_DIR = "$PWD/data"
node server.js
```

Open `http://localhost:3000`. The local server stores users in `data/users.json`; that file is ignored by Git and does not transfer to the online service. Local accounts use a different password hash from the Cloudflare version, so create the hosted administrator and learner accounts again after deployment.

## Free Cloudflare deployment

This project is configured for a Cloudflare Worker with static assets and a D1 database. The Worker checks entitlements before returning workbook HTML or question JavaScript. The database stores password hashes, active status, entitlements, sessions, and login throttling. The live application is [https://math-academy.dulsanka-math-academy.workers.dev/](https://math-academy.dulsanka-math-academy.workers.dev/). GitHub Pages cannot run these checks. Cloudflare's free plans have daily request and database usage limits; if a limit is reached, access may pause until the quota resets.

### One-time setup

1. Create a Cloudflare account on its Free plan and enable Workers for the account.
2. Install the Wrangler command-line tool from PowerShell:

   ```powershell
   npm install --global wrangler
   wrangler login
   ```

3. In the project folder, create the D1 database:

   ```powershell
   wrangler d1 create math-academy-users --update-config --binding DB
   ```

   Wrangler creates the database and updates the `database_id` value in `wrangler.toml`.

4. Create the database tables:

   ```powershell
   wrangler d1 migrations apply math-academy-users --remote
   ```

5. Add the initial administrator credentials as Worker secrets. Run each command and enter the requested value when Wrangler prompts. Use a unique password of at least 12 characters:

   ```powershell
   wrangler secret put BOOTSTRAP_ADMIN_USERNAME
   wrangler secret put BOOTSTRAP_ADMIN_PASSWORD
   ```

6. Deploy the site and Worker:

   ```powershell
   wrangler deploy
   ```

   Open the `workers.dev` URL shown by Wrangler and sign in using the bootstrap administrator username and password. The first successful API request creates the administrator in D1. Remove the two bootstrap secrets afterward in **Cloudflare Dashboard → Workers & Pages → math-academy → Settings → Variables and Secrets**. The account remains in D1 after removing them.

### Deploy automatically after GitHub pushes

The included `.github/workflows/deploy.yml` applies D1 migrations and deploys the Worker when changes are pushed to `main`. Set these two GitHub repository secrets first:

1. In Cloudflare, create an API token scoped to the account hosting this Worker, with **Workers Scripts: Edit** and **D1: Edit** permissions. Copy the account ID from the Cloudflare dashboard.
2. In GitHub, open the repository **Settings → Secrets and variables → Actions → New repository secret**. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` with the values from Cloudflare.
3. Commit and push changes to `main`. Check the repository's **Actions** tab for the deployment result. Future pushes update the Worker automatically.

Never add Cloudflare tokens or passwords to a source file or commit them to GitHub. The old GitHub Pages address `https://dulsanka.github.io/math-academy/` is a static copy and cannot provide this access control. Disable GitHub Pages publication. Because this repository is currently public, workbook source files are also visible on GitHub; make the repository private if the workbook content itself should be restricted.

## Technology

- HTML, CSS, and browser JavaScript for workbook pages
- Node.js for optional local access server
- Cloudflare Workers and D1 for online access management

## Parent and child accounts

Only an adult parent or guardian can register through the public form. They can register one to five children at once and request workbook years for each child. An administrator must approve the parent account and separately grant each child’s workbook access. Legacy under-18 learner profiles are converted to inactive child profiles by the next D1 migration; administrators can link them to an approved parent from **Manage Users** before approving them.

Parent portal progress is scoped to the signed-in parent’s linked children. The site records workbook, module, completion, time, topic, and error-count summaries; answers, notes, and drawings remain in the child’s browser. New dashboard history starts after this version is deployed and children practise while signed in. The dashboard includes child, workbook, period, and topic filters. Strength and practice suggestions are shown only after at least five questions across two sessions. Administrators can create approved parent accounts and link migrated child profiles to them in **Manage Users**.

### Local sample families

Two sample parent accounts and linked child test accounts are present in the ignored local `data/users.json` store. Their shared local-only password is `MathDemo2026!`; parent usernames are `sample_parent_1` and `sample_parent_2`. The existing local test account `Test1`, if present, is linked to the first sample parent; other local test children are linked to the second. These sample accounts are not added to Cloudflare D1 or GitHub. Do not create the sample credentials on the hosted site.
