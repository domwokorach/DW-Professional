# Testing

Automated tests use the built-in Node.js test runner (`node:test`) executed through `tsx`. There is no browser or component test framework installed.

## Commands

| Command | Purpose |
|---|---|
| `npm test` | Run every `tests/*.test.ts` file serially. |
| `npm run test:ci` | Same suite with coverage; writes `reports/ci/junit.xml` and `reports/ci/lcov.info` and prints the spec report. |
| `npx tsx --test tests/<name>.test.ts` | Run a single test file. |
| `npm run typecheck` | TypeScript check for the web app (`tsc --noEmit`). |
| `npm --prefix apps/mobile run typecheck` | TypeScript check for the Expo app. |

There is no standalone `lint` script; `npm run build` performs linting and type validation through Next.js.

## Test files

| File | Covers |
|---|---|
| `admin-auth.test.ts` | Password hashing and verification, post-login redirect safety, login throttle key. |
| `certifications-carousel.test.ts` | Certifications carousel logic. |
| `clock-angles.test.ts` | Clock angle calculations. |
| `companies-db.test.ts` | Company database access (**needs a database**). |
| `companies-live.test.ts` | Companies House live search and result merging, using a stubbed `fetch` (no network or database). |
| `design-tokens-contrast.test.ts` | Contrast of the shared design tokens. |
| `engineering-section.test.ts` | Engineering section: heading, one card per capability, six evidence links opening safely in a new tab, accessible link names, unique card titles, and that repository links point at files that exist. |
| `experience-duration.test.ts` | Career timeline duration formatting. |
| `linkedin-oidc.test.ts` | LinkedIn OpenID Connect helpers. |
| `resume-company.test.ts`, `resume-flow.test.ts`, `resume-regression.test.ts` | Portfolio Access / resume flow (**need a database**). |
| `resume-unit.test.ts` | Resume unit logic. |

## Database-backed tests

`companies-db`, `resume-company`, `resume-flow` and `resume-regression` read `DATABASE_URL` / `COMPANY_DATABASE_URL`. Some tests delete rows, so **only point them at a throwaway database, never production**. Apply migrations first:

```bash
npm run db:deploy && npm run companies:migrate
```

## Continuous integration

- **Jenkins** (`Jenkinsfile`): checkout, environment validation, `npm ci`, Prisma generate, typecheck (web and mobile), `npm audit --omit=dev --audit-level=high`, tests, web build, mobile web export, then archive artefacts in `reports/ci/`. Tests use `TEST_DATABASE_URL` when supplied, otherwise a temporary `postgres:16-alpine` container; with neither, the build is marked unstable and database tests are skipped. A release manifest is written only for a fully green build of `master`.
- **GitHub Actions** (`.github/workflows/ci.yml`): `npm ci`, typecheck and production build.

## Known issues

- The Engineering section's cards link to files that do not exist yet in the repository (`docs/TESTING.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/ACCESSIBILITY.md`, `docs/DEPLOYMENT.md`, `docs/ARCHITECTURE.md`). The "repository links point at files that exist" test is expected to fail until those files are added or the links are changed.
- This file was written from the scripts and sources; the suite has not been run as part of this update.
