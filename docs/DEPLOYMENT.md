# Deployment

The site deploys to [Vercel](https://vercel.com) through its Git integration: every push to
`master` that passes CI produces a production deployment, and every pull request gets its own
preview deployment. There is no separate deploy step or script in this repository — Vercel builds
directly from the pushed commit.

## Build

Vercel runs the project's own `build` script:

```bash
npm run build
```

`prebuild` runs first and regenerates the stack-icon assets and both Prisma clients
(`db:generate` for the main schema, `companies:generate` for the companies schema) before `next
build` compiles the app, so a deployment never ships against a stale client.

## Environment and data

Database access goes through `DATABASE_URL` (and `COMPANY_DATABASE_URL` for the companies
schema), configured in the Vercel project's environment variables, not committed to the
repository. Pending Prisma migrations are applied explicitly with:

```bash
npm run db:deploy
npm run companies:migrate
```

These are run deliberately against the real database, never automatically by the build — see
**Git and Deployment** in `CLAUDE.md` for why that stays a manual, explicit step.

## Gate

Branch protection on `master` requires the CI status check (Jenkins and/or GitHub Actions,
whichever is configured as required) to pass before a merge, so only a commit that has already
typechecked, passed its tests, and built successfully reaches Vercel.

## Rollback

Vercel keeps every previous deployment addressable; promoting an older deployment back to
production in the Vercel dashboard is the fastest way to roll back a bad release without reverting
commits first.
