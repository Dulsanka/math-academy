# Math Academy architecture

## Request flow

```text
Browser
  ├─ Public sign-in page and public styles
  ├─ Worker API: sign-in, sign-out, and current user
  └─ Entitlement-protected workbook URL and its scripts
       └─ Cloudflare Worker checks the session and workbook entitlement
            ├─ D1 stores hosted users, sessions, and login limits
            └─ public/ supplies the requested browser file
```

The browser files live under `public/`. Cloudflare uploads only that directory as static assets. The source code and local user data remain outside the deployed asset directory.

## Responsibilities

- `src/worker.js` is the hosted request handler. It owns API authentication, session checks, entitlement checks, security headers, and protected asset delivery.
- `src/local-server.js` provides the equivalent local development service. It stores local accounts in `data/users.json` and is not used by the Cloudflare deployment.
- `src/workbooks.mjs` is the shared route and asset manifest used by both server entry points.
- `public/index.html` and `public/assets/js/site.js` provide sign-in and navigation. The browser hides workbook links based on entitlements returned by the Worker; the Worker independently enforces access to every protected page and script.
- `public/workbooks/curriculum.html` is the shared layout for Years 6–11. The URL keeps its established year-specific name, and `workbook-loader.js` selects the matching curriculum engine.
- `migrations/` contains ordered, additive D1 schema changes. The GitHub Actions workflow applies migrations before deployment.

## Adding a curriculum year

1. Add the year’s curriculum engine or data under `public/assets/js/`.
2. Add the year’s public URL, file mapping, script mapping, and entitlement key to `src/workbooks.mjs`.
3. Add a navigation card in `public/index.html` and map its key to the established URL in `public/assets/js/site.js`.
4. Add the year to `workbook-loader.js` so its shared page initializes the correct theme and script.
5. Keep year-specific curriculum data in a separately protected script when access to another year must not reveal it.

Commit and push to `main` to run the deployment workflow. Local code changes do not update the hosted site until they are pushed.
