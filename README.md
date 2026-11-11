# NZ Interactive Mathematics Workbooks

A browser-based mathematics practice suite for New Zealand learners in Years 6–11, plus a foundational arithmetic workbook. The Node.js access server provides sign-in, per-user workbook entitlements, and an administrator screen for managing accounts.

## Workbooks

| File | Description |
| --- | --- |
| `index.html` | Sign-in page and navigation hub for entitled workbooks |
| `admin.html` | Administrator-only user and entitlement management |
| `server.js` | Authentication, session, entitlement checks, and protected page delivery |
| `1_interactive_math_workbook.html` | Configurable arithmetic and long-division practice |
| `6_year6_nz_mathematics_workbook.html` | Year 6 curriculum workbook |
| `7_year7_nz_mathematics_workbook.html` | Year 7 curriculum workbook |
| `2_year8_nz_mathematics_workbook.html` | Year 8 curriculum workbook |
| `3_year9_nz_mathematics_workbook.html` | Year 9 curriculum workbook |
| `4_year10_nz_mathematics_workbook.html` | Year 10 curriculum workbook |
| `5_year11_nz_mathematics_workbook.html` | Year 11 curriculum workbook |

## Features

- Guided, multi-step questions with immediate answer feedback
- Curriculum topics organized by strand and sub-strand
- Random practice sets, progress indicators, stars, streaks, and timers
- Tutor mode for customizing questions
- Text notes and a drawing scratchpad
- Printable and downloadable answer sheets
- Prepared math topic guides and a built-in calculator with formula reference
- Browser-local progress saving and recovery

Workbook progress is saved in each user's browser and does not sync between devices. User accounts and entitlements are stored by the access server in `DATA_DIR/users.json`; keep that directory on persistent storage and out of source control.

## Project Structure

```text
index.html
admin.html
admin.js
admin.css
server.js
1_interactive_math_workbook.html
2_year8_nz_mathematics_workbook.html
3_year9_nz_mathematics_workbook.html
4_year10_nz_mathematics_workbook.html
5_year11_nz_mathematics_workbook.html
6_year6_nz_mathematics_workbook.html
7_year7_nz_mathematics_workbook.html
assets/
  favicon.svg
  css/
    site.css
    interactive-workbook.css
    curriculum-workbook.css
  js/
    site.js
    interactive-workbook.js
    year6-workbook.js
    year7-workbook.js
    year8-workbook.js
    year9-workbook.js
    year10-workbook.js
    year11-workbook.js
```

The year-level workbooks share a stylesheet and keep their question logic in separate JavaScript files. Workbook HTML pages and their year-specific JavaScript files are served only after the server checks the signed-in user's entitlement. Shared styles and the sign-in page are public assets.

## Run Locally

Install Node.js 20 or later, then from the project directory set an initial administrator username and password (at least 12 characters) and a writable data directory. For example, in PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_USERNAME = 'academy-admin'
$env:BOOTSTRAP_ADMIN_PASSWORD = 'use-a-long-unique-passphrase-here'
$env:DATA_DIR = "$PWD/data"
node server.js
```

Open `http://localhost:3000`. The first start creates the administrator account if no admin exists yet. Use **Manage Users** to create student accounts, grant workbook access, disable accounts, and reset passwords. The server keeps sessions in memory, so a server restart signs users out. The user database survives restarts when `DATA_DIR` points to persistent storage.

## Deployment

The included `render.yaml` configures a Render Node web service, persistent user-data disk, health check, and automatic deploys from the `main` branch. To create it, push the project to GitHub, sign in to Render, choose **New > Blueprint**, connect the repository, and provide `BOOTSTRAP_ADMIN_USERNAME` plus a unique `BOOTSTRAP_ADMIN_PASSWORD` when prompted. Render then builds and starts the service. Future commits pushed to `main` trigger a new deploy.

The configured persistent disk requires a paid Render web-service plan. Do not remove or replace the disk after users are created unless you have backed up `DATA_DIR/users.json`. After the initial administrator is created, remove `BOOTSTRAP_ADMIN_PASSWORD` from the Render service environment. Use the deployed HTTPS URL; the production session cookie requires HTTPS.

The local `data/users.json` is intentionally not pushed to GitHub. The first hosted admin account is created from the Render bootstrap values; recreate student accounts and entitlements in the hosted **Manage Users** screen.

GitHub Pages alone cannot run the access server. Disable any GitHub Pages publication for this repository so it does not expose workbook files outside the entitlement checks. If workbook source content itself must remain confidential, make the GitHub repository private as well. The server protects workbook page and question-script requests served through the Node service, including direct URL requests.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- SVG favicon

## Contributing

Suggestions, curriculum feedback, and improvements are welcome. Please open an issue or pull request in the project repository.

## License

No license file is included yet. The project owner should choose and add a license before inviting reuse or redistribution.

## Author

Created by Dulsanka Kulasinghe.
