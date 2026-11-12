# NZ Interactive Mathematics Workbooks

A browser-based mathematics practice suite for New Zealand learners in Years 6-13, plus a foundational arithmetic workbook. The access service provides sign-in, per-user workbook entitlements, and administrator tools for managing accounts.

**Live application:** [Open Math Academy](https://math-academy.dulsanka-math-academy.workers.dev/)

## Project structure

```text
public/                    Browser pages and static assets deployed by Cloudflare
  index.html               Sign-in and workbook navigation
  register.html            Public learner registration and privacy notice
  account.html             Signed-in user profile and password management
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

## Learner registration and email setup

The public registration form collects the learner profile, username, password, school year and requested workbooks. Applicants under 18 must enter a parent or guardian name and email. Registration creates an inactive pending account; the learner cannot sign in until an administrator approves it and grants workbook access. Administrators review requests in **Manage Users → Registrations awaiting approval**. Declining a request deletes its account and profile. Approved users can edit their profile, change their password, request a password reset by email, and sign out.

Transactional messages (registration receipt, approval and password reset) use Resend's email API. Resend's current Free plan includes 3,000 emails per month with a 100-per-day limit, but it requires a domain you own and verify; a `workers.dev` address is not an email sending domain. See [Resend pricing](https://resend.com/pricing) and [verified domain requirements](https://resend.com/docs/dashboard/domains/introduction).

1. Create a Resend account, add a domain or subdomain you own, and publish the DNS records Resend supplies until it shows as verified.
2. Create a Resend API key. Add `RESEND_API_KEY` as a **Worker secret** in Cloudflare. Add `RESEND_FROM_EMAIL` as a Worker variable, using an address at your verified domain, for example `NZ Mathematics Academy <accounts@yourdomain.example>`.
3. For local testing, set the same values in the PowerShell session before starting Node:

   ```powershell
   $env:RESEND_API_KEY = 'your-resend-api-key'
   $env:RESEND_FROM_EMAIL = 'NZ Mathematics Academy <accounts@yourdomain.example>'
   node server.js
   ```

   Do not add these values to project files, `users.json`, or GitHub. If email is not configured or the provider rejects the message, registration returns an error and removes the unfinished pending record. After approval, if the provider is temporarily unavailable, use **Send approval email** on that account to retry. Password recovery responses intentionally do not reveal whether an email belongs to an account.

Registration collects a date of birth and home address because the current workflow requests them. The privacy notice explains why the application collects this information, who receives transactional messages, and that administrators can view the profile. Review your privacy notice, data retention needs, and obligations for child applicants before inviting real learners. Resend also processes recipient addresses and message content to deliver and log these emails.

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
