# Architecture

## Monorepo layout

An npm workspaces monorepo with two workspace globs:

- `packages/*` — currently `packages/design-tokens`, the shared design-token package consumed by
  both the web app and the mobile app, so a token change only has to be made once.
- `apps/*` — currently `apps/mobile`, an Expo Router app that reuses the same design tokens.

The web app itself lives at the repository root (`src/`), as a standard Next.js App Router
project.

## Web app

- **Framework**: Next.js (App Router) with React and TypeScript in strict mode.
- **Styling**: Tailwind CSS, plus shadcn/ui and Animate UI components, with light/dark theming
  driven by the shared design tokens.
- **Data**: Prisma against PostgreSQL, through two independently generated clients — one for the
  main schema (`prisma/schema.prisma`, output to `generated/prisma`) and one for a separate
  companies schema (`prisma/company/schema.prisma`, output to `generated/company`) — kept apart
  because they model unrelated data with their own migration history.
- **Media**: Cloudinary for hosted images where the content is uploaded rather than built into the
  repo (for example, comment avatars).

## Mobile app

`apps/mobile` is an Expo Router app sharing the same design-token package as the web app, so the
two surfaces stay visually consistent without duplicating token values.

## Admin surface

Admin routes and APIs sit behind a server-side session check on every request (see
`src/lib/admin/session.server.ts`), kept deliberately separate from the public-facing pages and
APIs — see `docs/COMMENTS.md` for how that separation is enforced for comments specifically.

## CI/CD

Two independent pipelines validate every change before it reaches `master`:

- **Jenkins** (`Jenkinsfile`) — typechecks both workspaces, audits dependencies, runs the test
  suite against a disposable Postgres container, builds the web app, and validates the mobile
  app's web export.
- **GitHub Actions** (`.github/workflows/ci.yml`) — typechecks, tests, and builds on every push
  and pull request to `master`.

Deployment itself is handled by Vercel's Git integration — see `docs/DEPLOYMENT.md`.
