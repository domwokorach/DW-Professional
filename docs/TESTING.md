# Testing

Everything here runs from `package.json` scripts and writes real reports. Nothing is mocked into a pass: if a
report is missing, a stage failed before it could be written.

## Commands

| Command | What it runs |
|---|---|
| `npm test` | Every `tests/*.test.ts` file with Node's built-in runner (through `tsx`). JUnit XML in `reports/junit/all.xml`. |
| `npm run test:unit` | Pure logic and server helpers. No database, browser or network. |
| `npm run test:integration` | Route handlers and stores against a real PostgreSQL (see [Test database](#test-database)). |
| `npm run test:component` | React components in jsdom with Testing Library. |
| `npm run test:coverage` | All suites with V8 coverage via `c8`; fails below the thresholds in `.c8rc.json`. |
| `npm run test:e2e` | Playwright browser tests (desktop and mobile Chromium). |
| `npm run test:a11y` | Playwright + axe-core accessibility tests. See [ACCESSIBILITY.md](ACCESSIBILITY.md). |
| `npm run lint` / `typecheck` | ESLint, and TypeScript for the web app and the Expo app. |

### Why the Node test runner

The existing suite already used `node:test` and `tsx`. It runs TypeScript directly, has built-in JUnit and
LCOV reporters and needs no extra config, so Vitest and Jest were not introduced. `c8` was added only because
Node has no HTML or JSON-summary coverage reporter and no threshold enforcement.

## Layout

```
tests/*.test.ts      node:test suites (unit, integration, component; assignment in scripts/run-tests.mjs)
tests/e2e/*.spec.ts  Playwright: site.spec.ts, a11y.spec.ts, deployment.spec.ts (post-deploy smoke)
playwright.config.ts projects: chromium, mobile, a11y, a11y-mobile, smoke
.c8rc.json           coverage scope, reporters and thresholds
scripts/run-tests.mjs  suite runner (always writes JUnit; optional coverage)
```

## Reports

| Report | Location | Produced by |
|---|---|---|
| JUnit XML | `reports/junit/<suite>.xml`, `reports/junit/e2e.xml` | Node runner / Playwright |
| Coverage HTML | `reports/coverage/index.html` | c8 |
| LCOV | `reports/coverage/lcov.info` | c8 |
| JSON summary | `reports/coverage/coverage-summary.json` | c8 |
| Playwright HTML report | `playwright-report/` | Playwright |
| Failure screenshots and traces | `test-results/` | Playwright (`only-on-failure`, `retain-on-failure`) |

All of these are git-ignored, uploaded as artefacts by CI, archived by Jenkins, and (for the numbers) published
to the portfolio's live status panel from the real files.

## Test database

Integration tests need a **throwaway** PostgreSQL. They never use `DATABASE_URL` from `.env`: the tests read
`TEST_DATABASE_URL` and are reported as skipped when it is unset. Never point it at a real database.

```bash
# one-off, isolated local server on port 55432 (Homebrew PostgreSQL; or use any empty database)
initdb -D /tmp/pgtest -U test --auth=trust && pg_ctl -D /tmp/pgtest -o "-p 55432" start
psql -h 127.0.0.1 -p 55432 -U test postgres -c "create database portfolio_test"

export TEST_DATABASE_URL=postgres://test@127.0.0.1:55432/portfolio_test
# Set both URLs explicitly so a developer .env can never be used by accident:
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
COMPANY_DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy --config prisma.company.config.ts
npm run test:integration
```

CI does the same against a `postgres:16` service container that exists only for the job.

## Coverage baseline

Measured on 2026-11-28 over **all** of `src/**` (including components and routes that have no tests yet, which is why the
numbers are modest), with the database available:

| Metric | Measured | Threshold |
|---|---|---|
| Lines / statements | 15.72% | 14% |
| Branches | 64.94% | 63% |
| Functions | 35.22% | 33% |

109 tests passed (66 unit, 6 component, 37 integration). Before the Engineering work the figures were 14.62% lines,
64.05% branches and 33.64% functions over 97 tests. Without `TEST_DATABASE_URL` the integration suites are skipped and
coverage is lower (9.39% lines at the first measurement), so `test:coverage` needs the database. Thresholds are set just
below the measurements so they catch regressions; raise them as tests are added. Nothing is excluded from the scope to
inflate the figure.

## Lint baseline

`npm run lint` reports **0 errors** and 64 warnings (measured 2026-11-28):

| Rule | Count | Note |
|---|---|---|
| `react-hooks/set-state-in-effect`, `refs`, `purity`, `immutability` | 35 | React Compiler advisories, set to `warn` in `eslint.config.mjs`. They flag existing mount-time state and ref patterns in animation and hero code; rewriting them risks the preserved design. |
| `@next/next/no-img-element` | 16 | Plain `<img>` where `next/image` is not used (remote or dynamic sources). |
| `react-hooks/exhaustive-deps` | 7 | Review each; some are intentional. |
| `@next/next/no-location-assign-relative-destination` | 6 | |

Burn them down one component at a time; do not add suppressions.

## Adding tests

- Logic: add `tests/<name>.test.ts` and register the name in `SUITES` in `scripts/run-tests.mjs` (the runner
  warns about unregistered files).
- Browser: add `tests/e2e/<name>.spec.ts`. Keep post-deploy tests read-only.
- Never disable or skip a failing test to get a green build; fix the cause.
