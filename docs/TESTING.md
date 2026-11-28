# Testing

Tests run on Node's built-in test runner (`node:test`) through `tsx`, with no separate test
framework to configure or keep in sync with the app's TypeScript/ESM setup.

## Running tests

```bash
npm test
```

Runs every `tests/*.test.ts` file with `--test-concurrency=1`, so suites that touch a shared
resource (such as the database) never run side by side.

```bash
npm run test:ci
```

The CI variant. It adds coverage instrumentation (`--experimental-test-coverage`) and writes
three reports under `reports/ci/`:

- `junit.xml` — consumed by Jenkins' `junit` step.
- `lcov.info` — line coverage, summarised by the Jenkinsfile into a percentage.
- stdout (`spec` reporter) — captured as a build artefact by GitHub Actions.

## What's covered

`tests/*.test.ts` covers component rendering (via `react-dom/server` and `jsdom`), route and
data-shape assertions, admin authentication, and repository content checks — including the test
in `engineering-section.test.ts` that confirms every link on the public site resolves to a real
file in this repository.

## Database-backed tests

A few suites exercise Prisma against a real database and are skipped — not failed — when
`TEST_DATABASE_URL` is unset, so `npm test` works on a machine with no database configured. Both
CI pipelines (Jenkins and GitHub Actions) provide a disposable Postgres instance so these suites
run on every push to `master` and every pull request.

## Where CI runs this

- **Jenkins** (`Jenkinsfile`): typecheck, security audit, `test:ci` against a throwaway
  containerised Postgres, then a production build.
- **GitHub Actions** (`.github/workflows/ci.yml`): typecheck, `npm test`, then a production
  build, on every push and pull request to `master`.
