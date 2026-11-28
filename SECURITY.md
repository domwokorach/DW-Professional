# Security policy

## Reporting a vulnerability

Please report it privately. **Do not open a public issue.**

- Email: **Dominic.Wokorach-O@outlook.com** with the subject "Security: DW-Professional".
- Include what you found, where (URL or file), steps to reproduce, and the impact you expect. Do not include
  other people's personal data.
- You can expect an acknowledgement within 5 working days and an assessment within 14. Valid reports are fixed
  as quickly as their severity warrants, and you are credited if you wish.
- Please give a reasonable time to fix before disclosing, and do not access, modify or delete data that is not
  yours, run denial-of-service tests, or test against other visitors.

Reports can also be made privately through GitHub (Security → Report a vulnerability; private vulnerability reporting is
enabled). A machine-readable contact is published at `/.well-known/security.txt`.

Supported version: the latest deployment of `master`. This is a personal portfolio; there is no bug bounty.

## Security controls and how each was verified (2026-11-28)

"Verified" means checked directly (a GitHub API response, a command, or a test run), not assumed from configuration.

| Control | Status | Evidence |
|---|---|---|
| Secret scanning and push protection | Enabled | GitHub `security_and_analysis` API; 0 open secret-scanning alerts |
| Private vulnerability reporting | Enabled | GitHub API |
| Committed secrets | None found | Pattern scan of tracked files and full git history. A `.env` was committed once (Aug 2026) but it was an empty 0-byte file. Pattern-based only: rotate any credential you suspect was ever exposed |
| Dependency vulnerabilities | 0 | `npm audit` and `npm audit --omit=dev` both report 0 (checked against the live registry) |
| Admin authentication | In place | Code review: random 256-bit session token in an HttpOnly cookie, only its SHA-256 stored, 8 h absolute and 30 min idle expiry, fixation protection, role read from the database, per-request validation, Argon2id passwords, login throttling, audit log |
| Admin CSRF | In place | Code review and test: state-changing admin APIs need a same-origin request and an HMAC token header; unauthenticated admin API requests return 401 (checked against a production build) |
| Public API hardening | In place | Code review: input validation, rate limits, same-origin checks on state-changing routes, SSRF-protected URL import, OAuth `state` check, short-lived download grants |
| Security headers | In place | Response headers checked on a production build: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`; stricter set on `/admin`; no `X-Powered-By` |
| Content-Security-Policy | **Report-only** (not enforced) | See below. Zero violations across the pages exercised in a browser sweep of a production build |
| Dependabot version updates | Configured and running | `.github/dependabot.yml`; successful Dependabot runs on 2026-11-28 |
| Workflow hardening | In place | Least-privilege `permissions`, no `pull_request_target`, every action pinned to a commit SHA (including `publish-package.yml`, fixed 2026-11-28) |

## Controls that are configured but NOT currently operating

- **GitHub Actions is not running.** Every job is refused with *"The job was not started because your account is
  locked due to a billing issue."* As a result **CodeQL, the `npm audit` gates, Dependency Review and the CI test jobs
  have not completed on GitHub**, and Code scanning has no analysis on record (and no default setup). Resolve the
  billing lock under GitHub → Settings → Billing, then re-run the workflows. Until then the same checks can be run locally
  (`npm audit`, `npm run lint`, `npm test`) and in Jenkins.
- **Branch protection is not enabled** on `master` (GitHub API: "Branch not protected"; no rulesets).
- **Dependabot security updates are disabled** (GitHub API). Version updates are configured; security-update pull
  requests are not opened automatically.

## Known issues (verified 2026-11-28)

- **Dependabot alert #2 (minimatch, medium, DoS):** open on `master`, whose lockfile has `minimatch@10.2.6`. The
  feature branch already locks `minimatch@11.0.9` (patched in 11.0.1), so merging it closes the alert. No other
  Dependabot, code-scanning or secret-scanning alerts are open.
- The earlier `npm audit` findings (`effect` via Prisma, `expo`/`minimatch`) no longer reproduce.
- `npm audit fix --force` is deliberately never used.
- The CSP still allows inline scripts (see below), so it limits where content can load from but does not by itself
  stop injected inline script.

## Content Security Policy

Defined in `src/lib/security-headers.ts` and sent as `Content-Security-Policy-Report-Only` with a reporting endpoint
(`/api/csp-report`, which accepts only small JSON bodies, is rate limited, stores nothing, and logs a summary with
query strings removed). It allows the site's own origin, Cloudinary (images and media), the weather-icon CDN
(images) and, when configured, the private S3 bucket for presigned uploads. Objects, base-tag changes, other form
targets and cross-origin framing are blocked.

Path to enforcement:

1. Leave report-only running on real traffic and review `[csp-report]` log lines for legitimate violations.
2. Exercise the flows that were not covered by the automated sweep: contact and portfolio-access forms with an
   attachment upload, the LinkedIn sign-in, certificate PDF previews and the admin dashboard.
3. Rename the header to `Content-Security-Policy` (keep reporting on) once reports are clean.
4. Longer term, replace `'unsafe-inline'` for scripts with a nonce or hash policy. This needs dynamic rendering (the
   pages are static today), so it is a separate change.

## Settings that need manual action in GitHub

Repository → Settings unless noted. These change the live repository, so they are recommendations, not applied by code.

1. Billing: clear the Actions billing lock (Account → Billing), then re-run CodeQL, Security and CI.
2. Code security → Code scanning: keep the CodeQL workflow, or enable "default setup".
3. Code security → Dependabot security updates: enable.
4. Branches → protect `master`: require pull requests and the CI, Security and CodeQL status checks, block force pushes
   and deletions.
5. Actions → General: require actions to be pinned to a full commit SHA, and set workflow permissions to read-only by default.
