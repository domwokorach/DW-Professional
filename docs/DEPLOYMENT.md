# Deployment

The site is deployed by **Vercel's Git integration** (project `dw-professional`). There is no `vercel.json` or
`vercel.ts`: framework settings are detected (Next.js) and the build is `npm run build`. CI and Jenkins never
deploy; they validate.

## Flow

| Event | Result |
|---|---|
| Push to a branch / open a pull request | Vercel builds a **preview** deployment. Previews sit behind Vercel Deployment Protection. |
| Merge to `master` | Vercel builds and promotes a **production** deployment (`https://www.dominicwokorach.me`). |
| Production deployment succeeds | GitHub receives a deployment status; `deployment-verification.yml` smoke-tests the live URL. |

Pull requests also run `ci.yml` (lint, type-check, tests, production build, browser and accessibility tests).
Require those checks before merging (repository settings → branch protection; `master` is currently
**not** protected, so this is a recommendation, not an enforced rule).

## Build and environment

- `npm run build` runs the `prebuild` hook: stack icons, then both Prisma `generate` commands, then `next build`.
  Prisma only generates clients here; **no migration runs during a build.**
- Environment variables are set in the Vercel dashboard (Project → Settings → Environment Variables) per
  environment. `.env.example` lists every name; values never go in Git. The site renders without them, and each
  integration reports itself unavailable until configured.
- Server-only secrets (`RESEND_API_KEY`, `DATABASE_URL`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`, `RESUME_HASH_SECRET`,
  Jenkins credentials, …) are read in `*.server.ts` modules and API routes only. Only `NEXT_PUBLIC_*` names reach
  the browser, and the only one used is `NEXT_PUBLIC_SITE_URL`. **No Vercel token is ever used in the browser or
  committed.**
- **Database migrations are applied by hand, deliberately** (`npm run db:deploy`, `npm run companies:migrate`), after
  review, never by CI and never against production without approval.

## Verifying a deployment

Read-only smoke tests (`tests/e2e/deployment.spec.ts`) check: HTTP 200 and a rendered `h1` with no uncaught page
errors; `/` redirects to `/en-gb`; privacy, terms, cookies and accessibility pages respond; `_next/static` assets
and the icon load; admin pages and APIs do not serve data without a session; `X-Content-Type-Options`; and there is
no horizontal overflow at 390px.

```bash
PLAYWRIGHT_BASE_URL=https://www.dominicwokorach.me npx playwright test --project=smoke
```

Also in `deployment-verification.yml` (production deployments, and manually via *Run workflow*), and in the
Jenkins pipeline when `DEPLOYMENT_URL` is set. Deployment logs: Vercel dashboard → Deployments → the deployment →
*Build Logs* / *Runtime Logs*, or `vercel inspect <url> --logs` and `vercel logs`.

### Last verified result

On 2026-11-28 against `https://www.dominicwokorach.me`: 6 of 7 passed. The security-headers check **failed** because
the headers added in this change were not yet deployed, which is the expected outcome until it ships. Re-run after
the merge deploys.

## Rollback

Production deployments are immutable, so rolling back means pointing the production domain at an earlier one:

1. Vercel dashboard → Deployments → choose the last good production deployment → **⋯ → Instant Rollback**, or
   `vercel rollback <deployment-url>`.
2. Run the smoke tests above.
3. Fix forward on a branch and merge; promoting a newer deployment ends the rollback.

Rolling back code does **not** roll back database migrations. Migrations here are written to be additive; if one
must be reverted, do it deliberately and separately.
