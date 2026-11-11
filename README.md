# NZ Interactive Mathematics Workbooks

A browser-based mathematics practice suite for New Zealand learners in Years 6–11, plus a foundational arithmetic workbook. The access service provides sign-in, per-user workbook entitlements, and administrator tools for managing accounts.

**Live application:** [Open Math Academy](https://math-academy.dulsanka-math-academy.workers.dev/)

## Workbooks and access files

| File | Description |
| --- | --- |
| `index.html` | Sign-in page and navigation hub for entitled workbooks |
| `admin.html` | Administrator-only user and entitlement management |
| `src/worker.js` | Cloudflare Worker API and protected page delivery |
| `migrations/0001_init.sql` | D1 tables for accounts, sessions, and login throttling |
| `server.js` | Optional local Node.js server |
| `1_interactive_math_workbook.html` | Configurable arithmetic and long-division practice |
| `6_year6_nz_mathematics_workbook.html` | Year 6 curriculum workbook |
| `7_year7_nz_mathematics_workbook.html` | Year 7 curriculum workbook |
| `2_year8_nz_mathematics_workbook.html` | Year 8 curriculum workbook |
| `3_year9_nz_mathematics_workbook.html` | Year 9 curriculum workbook |
| `4_year10_nz_mathematics_workbook.html` | Year 10 curriculum workbook |
| `5_year11_nz_mathematics_workbook.html` | Year 11 curriculum workbook |

The workbooks include guided questions with immediate feedback, curriculum topics by strand, random practice, progress indicators, stars, streaks, timers, tutor mode, notes, a drawing pad, printable answer sheets, topic guides, a calculator, and browser-local progress recovery. Progress is saved in each learner's browser and does not sync between devices.

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
