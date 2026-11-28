# Architecture

This describes what the repository contains today. File paths are real; diagrams are Mermaid and render on GitHub.

## Overview

An npm-workspaces monorepo:

| Path | What it is |
|---|---|
| `src/` | The website: Next.js (App Router), React, TypeScript, plain scoped CSS. |
| `apps/mobile/` | The companion app: Expo / React Native (iOS, Android, Expo Web). Imports the website's content from `src/data`; it does not duplicate it. |
| `packages/design-tokens/` | `@domwokorach/dw-professional-design-tokens`: the light and dark CSS tokens, published to GitHub Packages by `publish-package.yml` on a GitHub release. |
| `prisma/` | Two Prisma schemas: the portfolio database (`prisma/schema.prisma`) and the company directory (`prisma/company/schema.prisma`). |
| `tests/`, `.github/workflows/`, `Jenkinsfile` | Automated quality assurance and delivery (see below). |

## System context

```mermaid
flowchart LR
  visitor([Visitor browser]) -->|HTTPS| vercel[Vercel: Next.js site and API routes]
  expo([Expo app: iOS, Android, Web]) -->|HTTPS: /api/github, /api/engineering| vercel
  admin([Administrator]) -->|HTTPS + session cookie| vercel
  vercel --> pg1[(PostgreSQL: portfolio schema)]
  vercel --> pg2[(PostgreSQL: companies schema)]
  vercel -->|presigned uploads| s3[(Amazon S3, private)]
  vercel -->|transactional email| resend[Resend]
  vercel -->|OpenID Connect| linkedin[LinkedIn]
  vercel -->|company search| ch[Companies House API]
  vercel -->|contributions GraphQL, Actions REST| gh[GitHub API]
  vercel -->|weather| ow[OpenWeather]
  site[(Cloudinary media)] -.->|images| visitor
  gha[GitHub Actions] -->|deployment status, commit status| gh
  jenkins[Jenkins, local] -.->|optional, only if reachable| vercel
```

Optional integrations are off until their environment variables exist; each one reports itself unavailable
instead of failing the page.

## Components of the web application

```mermaid
flowchart TB
  subgraph app[src/app: routes]
    pages["/en-gb, /privacy, /terms, /cookies, /accessibility, /en-gb/developer-id, /en-gb/portfolio-access, /en-gb/resume/verify"]
    admin["/admin/*: protected pages"]
    api["/api/*: route handlers"]
    proxy["proxy.ts: admin gate and headers"]
  end
  pages --> views[src/views: page compositions]
  views --> comps[src/components: sections, UI, animations]
  comps --> data["src/data: content as typed modules"]
  comps --> hooks[src/hooks]
  api --> lib["src/lib/*.server.ts: stores, email, crypto, S3, rate limit"]
  admin --> lib
  lib --> prisma[(Prisma Client 7 + pg adapter)]
  data --> expo[apps/mobile]
  tokens[packages/design-tokens] -.-> comps
```

- **App Router**: `/` redirects to `/en-gb` (`next.config.ts`). The home page is statically generated and revalidated;
  dynamic data (comments, GitHub activity, engineering status) loads from API routes after render.
- **Styling**: plain CSS per section (`src/styles/*.css`) over the tokens in `base.css`; no Tailwind.
- **Server/browser boundary**: server code lives in `*.server.ts`; a test (`tests/resume-unit.test.ts`) fails if browser code imports it.
- **Shared types**: `src/lib/github/types.ts` and `src/lib/engineering/types.ts` are used by the website, the API routes and the Expo app.

## Data

Two PostgreSQL schemas, each with its own Prisma config and migrations (`prisma.config.ts`, `prisma.company.config.ts`):

- `portfolio`: `ContactMessage`, `Media`, `Comment`, `AdminUser`, `AdminSession`, `AdminAuditLog`, `AdminLoginAttempt`,
  `PortfolioAccess`, `PortfolioAccessFile`, `ResumeAccess`, `ResumeEvent`, `ResumeFile`.
- `companies`: `Company` (imported from Companies House bulk data; see `docs/COMPANIES.md`).

Migrations are applied by hand after review (`npm run db:deploy`, `npm run companies:migrate`); builds only run `prisma generate`.

## Data flow: contact enquiry (representative)

```mermaid
sequenceDiagram
  participant B as Browser
  participant R as POST /api/contact
  participant S as S3
  participant D as PostgreSQL
  participant E as Resend
  B->>R: optionally POST /api/upload for a presigned URL
  R-->>B: presigned PUT URL (validated name and size)
  B->>S: PUT file directly
  B->>R: form + attachment key
  R->>R: rate limit, origin check, validate and sanitise
  R->>D: store enquiry (if configured)
  R->>E: send email (if configured)
  R-->>B: 200, or field errors
```

## Authentication and authorisation

There are no public accounts. The only authenticated area is `/admin` (single administrator role).

```mermaid
sequenceDiagram
  participant A as Administrator
  participant P as proxy.ts
  participant L as POST /api/admin/login
  participant D as PostgreSQL
  participant H as Admin page or API
  A->>P: GET /admin/...
  P-->>A: no session cookie, redirect to login (no-store, noindex, frame DENY)
  A->>L: email + password
  L->>D: throttle check, Argon2id verify, audit log
  L->>D: store SHA-256 of a random 256-bit token
  L-->>A: Set-Cookie HttpOnly, Secure, SameSite=Lax (8h absolute, 30min idle)
  A->>H: request with cookie
  H->>D: validate session hash, expiry and idle time on EVERY request
  H->>H: state-changing calls require the CSRF header (HMAC of the session token)
  H-->>A: data
```

`proxy.ts` is only the first gate (it checks that a cookie exists); every admin page and API re-validates against the
database in `src/lib/admin/session.server.ts`. Visitors can optionally import their name and email through LinkedIn
OpenID Connect (`src/lib/linkedin.server.ts`): random `state` and `nonce`, sealed in a short-lived cookie, validated on
the callback. Résumé access uses emailed PINs and links with keyed hashes and constant-time comparison.

## Live engineering status

`GET /api/engineering/status` (`src/lib/engineering/status.server.ts`) reads GitHub's REST API server-side with a 5s
timeout and a 5-minute cache, and backs off after a rate limit while serving the last good answer flagged `stale`.
Jenkins is contacted only when `JENKINS_URL` and `JENKINS_JOB` are set; otherwise it is `not_configured`, and an unreachable
Jenkins is `unavailable`. Test and coverage numbers come from a commit status (`engineering/test-report`) that CI
writes from the real JUnit and coverage files. If it is absent, the site shows no numbers. No credential reaches the client.

## Delivery

```mermaid
flowchart LR
  dev[Developer] -->|push / PR| gh[GitHub]
  gh --> ci["GitHub Actions: ci.yml (lint, types, tests + coverage, build, Playwright + axe)"]
  gh --> sec["security.yml, codeql.yml"]
  gh -->|Git integration| vercel[Vercel]
  vercel -->|preview on PR| prev[Preview deployment]
  vercel -->|merge to master| prod[Production deployment]
  prod -->|deployment_status| verify["deployment-verification.yml: smoke tests on live URL"]
  ci -->|master only| status["commit status engineering/test-report"]
  jen["Jenkins: Jenkinsfile (same checks, parallel stages, JUnit + archives)"] -.-> gh
  release[GitHub release] --> publish["publish-package.yml: design-token package to GitHub Packages"]
```

- **GitHub Actions** (`.github/workflows/`): `ci`, `security`, `codeql`, `accessibility`, `deployment-verification`, `publish-package`.
  Least-privilege permissions, actions pinned to SHAs, concurrency groups, npm cache.
- **Jenkins** (`Jenkinsfile`): a second, self-hosted runner for the same gates. It is not exposed publicly.
- **Vercel**: deployment only; see [DEPLOYMENT.md](DEPLOYMENT.md), including rollback.
- **Quality gates**: ESLint, TypeScript for web and Expo, unit/integration/component tests with coverage thresholds,
  Playwright end-to-end and axe accessibility, `npm audit`, CodeQL. See [TESTING.md](TESTING.md), [ACCESSIBILITY.md](ACCESSIBILITY.md) and [../SECURITY.md](../SECURITY.md).

## Source versus published

The design-token package exists in source (`packages/design-tokens`) and has a publish workflow triggered by a GitHub
release. Whether a given version is *published* to GitHub Packages is a property of the registry, not of the source;
check the repository's Packages tab. This document makes no claim about it.
