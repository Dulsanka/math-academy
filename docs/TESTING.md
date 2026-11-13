# Quality and test plan

The project uses Node's built-in test runner and has no runtime or test-package dependencies. The deploy workflow runs the syntax check and the full automated suite before it applies a migration or deploys the Worker.

## Repeatable local checks

Use Node.js 20 or later from the repository directory:

In PowerShell, if script execution policy blocks `npm.ps1`, prefix these commands with `npm.cmd` (for example, `npm.cmd run check`). No execution-policy change is needed.

```sh
npm run check:syntax
npm run test:unit
npm run test:integration
npm run test:system
npm run test:e2e
npm run test:compatibility-accessibility
npm test
```

`test:unit` covers shared validation, email templates, expiry rules, curriculum manifests and question-generation logic. `test:integration` and `test:e2e` exercise the local HTTP server, authentication, role access, parent/child workflows, entitlements, registration approval, and session handling. `test:system` checks static pages and links; `test:compatibility-accessibility` checks navigation destinations, accessible control names, keyboard-focus styling, and viewport metadata. The integration and E2E commands currently use the same HTTP scenario; their names separate those stages for CI and future browser automation.

## Performance and load

The built-in load driver starts an isolated local server with a temporary data directory, signs in a temporary administrator, and distributes authenticated and static requests across the server:

```sh
npm run test:load
npm run test:load -- --requests=1000 --concurrency=40
```

The command reports throughput and p50, p95, and p99 response time. It fails on request errors, but does not apply a machine-specific latency threshold. This is a local capacity check; it does not establish Cloudflare production capacity or test traffic against the live site.

## Compatibility and accessibility

Automated checks verify document language and viewport metadata, unique IDs, accessible names and types on static buttons, form labels, keyboard-focus styling, and section-navigation targets. These checks are a static baseline. They do not replace testing with actual browser engines, assistive technology, zoom, or touch input.

Before a release, manually check the sign-in, registration, admin and parent workflows in current Chrome/Edge, Firefox, and Safari (including a phone-sized viewport). Use keyboard-only navigation and one screen reader, confirm visible focus, sensible heading order, form error announcements, zoom to 200%, and chart information that remains understandable without colour alone.

## Acceptance testing (UAT)

UAT requires a person with access to the deployed staging site and its configured Gmail/D1 services. Use test accounts and do not perform destructive checks on real learner accounts.

- **Administrator:** sign in, view the separate admin sections, create an admin and confirm both onboarding emails and the 24-hour single-use setup link, resend the invite, create a pre-approved parent, approve/decline pending registrations, grant/remove a workbook, manage family links, and sign out.
- **Parent:** register a family, confirm it returns to sign-in, wait for approval, sign in, filter the dashboard, view charts and activity, add a child, request a workbook, reset a child password, disable/enable the child, and delete a test child.
- **Child:** sign in using child credentials, confirm only granted workbooks appear, open an allowed workbook, and confirm a direct URL to an ungranted workbook is denied.
- **Recovery and delivery:** test a password reset and admin setup-link expiry using controlled accounts; confirm an expired or already-used link is rejected. Confirm email delivery from the configured sender.
- **Sign-off:** record tester, date, browser/device, result, and any defects. The release owner should approve the checklist before production use.

## Limits of this test run

No browser automation framework or browser engine is configured in this repository environment. Browser-level UI automation, cross-engine checks, assistive-technology checks, Cloudflare production load testing, and human UAT must be completed in the release environment. A real Cloudflare D1 binding and Gmail secrets are also not present in the local test harness.
