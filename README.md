# DOMINIC — Portfolio

DOMINIC is a production-oriented developer portfolio for Dominic Wokorach Olanya. It presents professional experience, projects, technical skills, certifications and achievements through an editorial cream-and-navy interface. It also includes moderated testimonials, contact enquiries, protected portfolio-access workflows and private administration tools.

## Main features

- Responsive portfolio sections for the hero, developer profile, skills, projects, career timeline, achievements, testimonials and contact details.
- Light and dark themes with a saved visitor preference.
- Accessible motion with `prefers-reduced-motion` fallbacks.
- Contact enquiries delivered through Resend, optionally stored in PostgreSQL and optionally uploaded to private Amazon S3 storage.
- Moderated visitor comments with optional avatars, verified and italic presentation states, and a private admin workflow.
- QR-driven Portfolio Access flow with optional LinkedIn OpenID Connect import, file attachments and private administration pages.
- Companies House-backed company suggestions using a separate imported company database.
- Server-rendered legal, privacy, cookie and accessibility pages.

## Technology stack

- Next.js 15 App Router, React 19 and TypeScript.
- Plain CSS organised by section; no Tailwind runtime.
- Motion, React Spring and React Three Fiber for focused interaction and visual effects.
- Prisma ORM 7 with PostgreSQL.
- Resend for transactional email.
- Amazon S3 for optional private file storage.
- Cloudinary for versioned media sources.
- Argon2id password hashing and server-managed administrator sessions.

## Prerequisites

- Node.js 20.19 or newer.
- npm.
- PostgreSQL only when persistence, comments, admin tools or Portfolio Access records are required.
- Optional service accounts for Resend, Amazon S3, LinkedIn, Companies House and OpenWeather.

## Installation

```bash
git clone <repository-url>
cd DW-Professional
npm install
cp .env.example .env
```

`npm install` generates both Prisma clients through the `postinstall` script. Replace values in `.env` with credentials from your own services. Never commit `.env`, `.env.local` or copied production settings.

## Environment configuration

The application renders without environment variables, but integrations remain unavailable until configured. `.env.example` is the authoritative template.

| Group | Variables | Purpose |
|---|---|---|
| Site | `NEXT_PUBLIC_SITE_URL` | Canonical production origin and QR/redirect URLs. |
| Email | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Email provider credentials plus the contact recipient and verified sender. |
| Portfolio database | `DATABASE_URL`, `PORTFOLIO_DATABASE_URL`, `DATABASE_SCHEMA` | Enquiries, comments, administrators and Portfolio Access records. |
| Notifications | `COMMENTS_NOTIFY_EMAIL`, `PORTFOLIO_ACCESS_NOTIFY_EMAIL` | Optional notification recipients. |
| Contact storage | `AWS_REGION`, `AWS_S3_BUCKET_NAME` | Private S3 attachment uploads. |
| Local AWS credentials | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Local development only; prefer workload identity in production. |
| Company data | `COMPANY_DATABASE_URL`, `COMPANY_DATABASE_SCHEMA`, `AWS_S3_BUCKET`, `AWS_S3_KEY`, `COMPANIES_S3_URI`, `AWS_S3_ENDPOINT`, `COMPANIES_HOUSE_API_KEY` | Company dataset import, search and verification. |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | Optional Portfolio Access OpenID Connect flow. |
| Weather | `OPENWEATHER` | Optional London weather quick fact. |
| Proxy trust | `TRUST_PROXY_HEADERS` | Opt in only when a trusted non-Vercel proxy overwrites forwarded IP headers. |

Use placeholders in shared examples:

```ini
DATABASE_URL="your-database-url"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
RESEND_API_KEY="your-resend-api-key"
```

All secrets are server-only. Do not add `NEXT_PUBLIC_` to a secret variable.

## Local development

```bash
npm run dev
```

Open <http://localhost:3000/en-gb>. `/` redirects to the localised home route. Optional integrations fail closed or show their documented unavailable state when not configured.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Generate icons and Prisma clients, lint/type-check through Next.js, and create the production build. |
| `npm start` | Serve the completed production build. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm test` | Run the automated Node/TypeScript test suite. |
| `npm run package:build` | Generate the reusable design-token package from the canonical CSS source. |
| `npm run icons` | Rebuild `src/data/stack-icons.ts` from configured Iconify identifiers. |
| `npm run db:generate` | Generate the portfolio Prisma client. |
| `npm run db:migrate` | Create or apply portfolio migrations in development. |
| `npm run db:deploy` | Apply committed portfolio migrations in deployment environments. |
| `npm run db:studio` | Open Prisma Studio for the portfolio database. |
| `npm run db:seed` | Create or intentionally reset the first administrator from temporary environment values. |
| `npm run companies:generate` | Generate the separate company-data Prisma client. |
| `npm run companies:migrate:dev` | Create or apply company-data migrations in development. |
| `npm run companies:migrate` | Apply committed company-data migrations. |
| `npm run companies:import` | Import the configured Companies House dataset. |
| `npm run admin -- <command>` | Manage administrator accounts and sessions from the terminal. |

There is no standalone `lint` script. `next build` performs the repository's configured linting and type validation; `npm run typecheck` is available for a faster TypeScript-only check.

## Database setup and migrations

The main schema is [prisma/schema.prisma](prisma/schema.prisma). `prisma.config.ts` uses `PORTFOLIO_DATABASE_URL` when supplied, otherwise `DATABASE_URL`, and scopes tables to `DATABASE_SCHEMA` (`portfolio` by default).

```bash
npm run db:generate
npm run db:migrate       # local development
npm run db:deploy        # CI/production
```

The separate company-search schema is [prisma/company/schema.prisma](prisma/company/schema.prisma) and always uses `COMPANY_DATABASE_URL`. See [docs/COMPANIES.md](docs/COMPANIES.md).

To create an administrator, temporarily set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, apply migrations and run `npm run db:seed`. Remove the plaintext password from the environment after creation. See [docs/COMMENTS.md](docs/COMMENTS.md) for moderation details.

## Production build

```bash
npm run typecheck
npm run build
npm start
```

The build regenerates derived icons and both Prisma clients before compiling. Generated clients and build outputs are ignored by Git.

## Deployment

The current production target is Vercel. Configure server-side variables in the deployment environment, set `NEXT_PUBLIC_SITE_URL`, and run `npm run db:deploy` against the intended database before promoting schema-dependent features.

Never expose Prisma Studio, administrator scripts, database URLs or long-lived AWS credentials publicly. Prefer Vercel Marketplace integrations or workload identity where supported.

## Project structure

```text
/
├── docs/                    Operational guides for comments, company data and S3
├── prisma/                  Main and company schemas plus committed migrations
├── public/                  Static CV, hero imagery, audio and decoder assets
├── scripts/                 Admin, import, media and generated-icon tooling
├── src/
│   ├── app/                 App Router pages, layouts and API route handlers
│   ├── components/
│   │   ├── ui/              Shared primitives and adapted third-party components
│   │   ├── layout/          Site-wide header, footer, theme and background
│   │   └── <feature>/       Feature sections such as contact, comments and hero
│   ├── config/              Site, legal, media and feature configuration
│   ├── data/                Static portfolio content and generated icon data
│   ├── hooks/               Shared React hooks
│   ├── lib/                 Validation, services and server-only integrations
│   │   └── admin/           Authentication, moderation and audit services
│   ├── styles/              Global tokens and section-scoped CSS
│   ├── types/               Shared domain types
│   └── views/               Route-level page compositions
├── tests/                   Automated tests
├── COPYRIGHT.md             Ownership and third-party copyright boundaries
├── DESIGN.md                Design-system and component conventions
├── LICENSE.md               Repository licence and third-party notice
└── PRIVACY.md               Developer-facing data-handling documentation
```

Feature components remain grouped by domain instead of being moved into a new `sections` folder solely for naming. Server integrations use the `*.server.ts` suffix where applicable. Shared React hooks live only in `src/hooks`.

## Accessibility

- Semantic headings, landmarks, lists, forms, `<blockquote>` and `<time>` elements are used where appropriate.
- Keyboard focus states remain visible and interactive controls meet practical touch-target sizes.
- Validation errors are associated with fields and status changes use ARIA live regions.
- Motion-heavy experiences honour `prefers-reduced-motion` and remain usable without animation.
- Responsive layouts avoid page-level horizontal scrolling and preserve readable text sizes.
- Light and dark themes use shared contrast-aware tokens.

See [DESIGN.md](DESIGN.md) and the live `/accessibility` page for implementation details.

## Security

- Public API routes validate data again on the server and apply rate limits to submission endpoints.
- Submission identifiers provide idempotency for retries and duplicate clicks.
- Administrator passwords are hashed with Argon2id; sessions use random tokens stored as hashes and HttpOnly cookies.
- Uploaded files are type/size checked. S3 objects remain private and use short-lived signed URLs.
- Secrets are read only in server code and ignored environment files.
- Public comment output excludes private moderation data.

Security controls reduce risk but are not a certification. Review dependencies, access policies and retention settings before each production release.

## Development and contribution notes

- Keep edits feature-scoped and preserve the established data/config/component separation.
- Put reusable interaction primitives in `src/components/ui`; keep feature-specific UI beside its section.
- Put shared hooks in `src/hooks`, static content in `src/data`, operational configuration in `src/config`, and server integrations in `src/lib` with a `.server.ts` suffix.
- Use existing CSS tokens instead of adding near-duplicate colours, radii or shadows. See [DESIGN.md](DESIGN.md).
- Run `npm run typecheck` and `npm run build` before submitting changes.
- Update privacy and setup documentation whenever a change affects data collection, storage, third parties or environment variables.

## Additional documentation

- [DESIGN.md](DESIGN.md) — visual language and reusable UI conventions.
- [COPYRIGHT.md](COPYRIGHT.md) — ownership and third-party copyright boundaries.
- [PRIVACY.md](PRIVACY.md) — implemented data flows and documentation boundaries.
- [LICENSE.md](LICENSE.md) — permitted use and third-party ownership.
- [docs/COMMENTS.md](docs/COMMENTS.md) — comments, moderation and administrator setup.
- [docs/COMPANIES.md](docs/COMPANIES.md) — company dataset and search setup.
- [docs/S3_SETUP.md](docs/S3_SETUP.md) — private attachment storage.

## Packages and releases

The current application and release version is **1.0.1**. The deployable Next.js application remains private in npm metadata and is not published as a package.

The repository publishes the focused, reusable `@domwokorach/dw-professional-design-tokens` package to [GitHub Packages](https://github.com/users/domwokorach/packages). It contains the canonical light and dark CSS custom properties generated from `src/styles/base.css`.

Configure npm for the GitHub registry with a token that has `read:packages`; keep the token in your environment and never commit it:

```ini
@domwokorach:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```bash
npm install @domwokorach/dw-professional-design-tokens@1.0.1
```

Published versions follow [Semantic Versioning](https://semver.org/): patch releases contain compatible maintenance work, minor releases add compatible functionality, and major releases may contain breaking changes. Git tags, GitHub Releases, the root application version and the design-token package version are kept aligned. Releases and detailed notes are available from the [DW-Professional repository](https://github.com/domwokorach/DW-Professional/releases).

## Third-party UI components

The repository includes adapted components from Aceternity UI, Animate UI, Lucide Animated, Magic UI, React Bits, Loading UI and Vue Bits. Source notes are kept in the relevant files. Shadcn is configured through `components.json`; do not run `shadcn init` over the existing setup. See [DESIGN.md](DESIGN.md#shadcnui-and-shadcn-blocks) before importing or updating registry components.

## Licence

This project is proprietary and all rights are reserved unless the copyright holder grants written permission. See [LICENSE.md](LICENSE.md) and [COPYRIGHT.md](COPYRIGHT.md). Third-party packages and assets remain subject to their own licences and terms.
