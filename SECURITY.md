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

Supported version: the latest deployment of `master`. This is a personal portfolio; there is no bug bounty.

## What is in place

- **Secrets**: only in environment variables (`.env.example` lists names, never values). `.env*` is ignored;
  CI fails if an env file or a private-key/token pattern is tracked. GitHub secret scanning and push protection
  are enabled on the repository.
- **Dependencies**: Dependabot (npm and GitHub Actions, weekly), `npm audit signatures`, a blocking
  `npm audit --omit=dev --audit-level=critical` gate, and Dependency Review on pull requests.
- **Code scanning**: CodeQL (`security-extended`) on pull requests, `master` and weekly.
- **CI hardening**: workflows use least-privilege `permissions`, actions pinned to commit SHAs, no
  `pull_request_target`, no secrets in pull-request jobs.
- **Application**: server-side validation of all input; admin sessions stored server-side and checked on every
  request, Argon2id password hashing, login throttling and an audit log; rate limits on public APIs; private
  uploads via presigned S3 URLs; secure headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security`), with stricter headers on admin routes.

## Known issues and gaps (verified 2026-11-28)

`npm audit --omit=dev` reports **6 vulnerabilities (3 high, 3 moderate)** after the non-breaking
`npm audit fix` (which resolved `mysql2`, `deepmerge-ts` and `fast-uri`). They cannot be fixed without a breaking change:

| Package | Severity | Reason it remains |
|---|---|---|
| `effect` via `@prisma/config` via `prisma` | high | Fix offered is a downgrade to Prisma 6.12 (breaking). Dev-time CLI config tooling, not part of the request path. |
| `expo`, `@expo/fingerprint`, `minimatch` | moderate | Fix offered is a downgrade to Expo 52 (breaking). Build tooling for the companion app. |

`npm audit fix --force` is deliberately not used. Re-check regularly; the weekly Security workflow prints the
current report.

Not yet implemented: a `Content-Security-Policy` (needs a nonce-based policy trialled in report-only mode first),
branch protection on `master` (recommended: require the CI checks), Dependabot *security updates* (currently off in
repository settings; version updates are configured).
