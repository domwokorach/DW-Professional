# Security Policy

## Reporting a vulnerability

If you find a security issue in this repository or in the deployed site, please report it
privately rather than opening a public issue. Email **dominicolanya@gmail.com** with:

- A description of the issue and its potential impact.
- Steps to reproduce it.
- Any relevant request/response details or proof-of-concept code.

This is a personal portfolio project with no dedicated security team, but reports are read and
acted on. There is no bug bounty program.

## Scope

- The deployed site at https://www.dominicwokorach.me and its API routes.
- This repository's source code and CI/CD configuration.

Out of scope: third-party services the site depends on (Vercel, Cloudinary, GitHub) — please
report issues in those platforms directly to their own security teams.

## Supported versions

Only the code currently deployed from `master` is maintained; there are no older versions to
support.

## Practices

- Dependencies are installed from a committed lockfile (`package-lock.json`) for reproducible
  builds, and `npm audit --omit=dev --audit-level=high` runs on every CI build (see
  `Jenkinsfile`), failing the build on new high or critical findings in production dependencies.
- Admin routes and APIs require a server-side session on every request; no admin functionality is
  reachable from the public site.
- Secrets (database URLs, API keys) are provided through environment variables in Vercel and
  Jenkins, never committed to the repository.
- User input (comments, contact forms) is validated and sanitised server-side before it is stored
  or rendered.
