# DW Professional Portfolio

A modern professional portfolio showcasing my work as a Software Engineer & Frontend Developer, with an admin dashboard, live chat, moderated public comments, and a company-lookup feature backed by a locally imported Companies House dataset.

🌐 Live Portfolio: <https://www.dominicwokorach.me/>

## About

DW Professional is my personal software engineering and freelance portfolio.

The website showcases my professional experience, freelance projects, case studies, technical skills and development journey through a responsive, accessible and modern user interface. It also includes an authenticated admin area for managing live chat conversations and comment moderation, and a "Company (optional)" lookup on the contact and comment forms backed by a self-hosted copy of the UK Companies House bulk dataset.

It is designed for recruiters, hiring managers, freelance clients, engineering teams and technology professionals who want to understand my experience and the digital products I build.

## Contents

- [Features](#features)
- [Freelance Projects](#freelance-projects)
- [Case Studies](#case-studies)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Company Data & Search](#company-data--search)
  - [How it works](#how-it-works)
  - [AWS S3 import process](#aws-s3-import-process)
  - [Running the import](#running-the-import)
  - [Search endpoint](#search-endpoint)
  - [Admin-only manual CSV upload](#admin-only-manual-csv-upload)
- [Database Migrations](#database-migrations)
- [Admin Dashboard & Authentication](#admin-dashboard--authentication)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Security](#security)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Contributors](#contributors)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Features

- Responsive, accessible single-page portfolio with freelance project showcase and detailed case studies
- Contact form and public comment form, both with an optional company-lookup field
- Company lookup backed by a self-hosted copy of the Companies House "Basic Company Data" bulk export — searches by name, postcode or registration number, with debouncing, request cancellation, loading/no-results/error states, and manual entry when nothing matches
- Admin-only bulk import of the Companies House dataset from a private AWS S3 object, plus a smaller admin-only manual CSV upload/replace flow
- Admin dashboard (`/admin`) with JWT + server-side session authentication: live chat, comment moderation, account/device/security settings
- Live chat between visitors and admins over Socket.IO, with a separate email-PIN-verified public comment flow
- Internal AI Search Assistant demo, powered by the OpenAI Responses API and File Search over a vector store
- Location-aware weather widget powered by OpenWeather
- SEO metadata, sitemap and robots configuration
- Dark, premium UI design with `prefers-reduced-motion`-aware motion effects

## Freelance Projects

Selected freelance and independent projects, presented with live links and short, factual descriptions:

- **[News](https://the-daily-wire-two.vercel.app/)** — a modern news web application delivering UK and world headlines across politics, business, health, tech, sport and weather, built with Next.js and TypeScript.
- **[Dog Booking System](https://booking-system-for-dogs.vercel.app/)** — a booking-system application for managing dog-related appointments (grooming, training, daycare, boarding), built with React and TypeScript.
- **[JIRA Project Management System](https://jiraprojectmanagementsystem.vercel.app/)** — a project-management application exploring task organisation, issue tracking and workflow-based delivery, built with React and TypeScript.

Full write-ups (technology, challenge, approach, outcome) are available on each project's detail page in the live portfolio.

## Case Studies

Professional case studies covering real work and concept explorations. Each one distinguishes **my individual contribution** from the wider organisation, team or platform it sat within, and concept/prototype work is clearly labelled as such:

- **Sky — Cloud-Native Engineering** — contributing to AWS-hosted microservices supporting catalogue, pricing and billing, within a wider Agile Scrum engineering team.
- **Specialist Disability** — accessibility-focused frontend work within online banking.
- **Halifax Piggy Banking** *(Concept / UX Prototype)* — UX prototypes and wireframes exploring digital banking for younger customers.
- **UI Delivery & Transformation** — reviewing, testing and resolving frontend issues across customer-facing digital banking interfaces for Lloyds Bank and Halifax.
- **Innovation Community** — supporting delivery of the Innovation Communities Conference 2018.
- **Innovation X** — frontend improvements to an internal Neo4j-backed search experience.
- **Internal AI Search Assistant** *(Proof of Concept)* — a working chatbot demo (built into this repository) exploring conversational search over internal knowledge.

Full case studies, including context, challenge and outcome, are available on each case study's detail page in the live portfolio.

## Requirements

Verified in this environment:

| Requirement | Version used here |
| --- | --- |
| Node.js | v25.9.0 (repo targets Node 20+; no `engines` field is pinned in `package.json`) |
| npm | bundled with the above Node.js install |
| Next.js | 15.5.25 |
| Prisma / @prisma/client | 6.12.0 / 6.19.3 |
| PostgreSQL | any version supported by the configured `DATABASE_URL` (tested here against a managed Postgres instance) |

## Installation

```bash
git clone https://github.com/domwokorach/DW-Professional.git
cd DW-Professional
npm install
cp .env.example .env.local
# fill in .env.local — see Environment Variables below
npx prisma migrate deploy   # apply the database schema (see Database Migrations)
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The main portfolio works without any API credentials. Company lookup, the AI Search Assistant, live chat, the admin dashboard and email delivery each show a clearly-labelled unavailable/error state until their environment variables are configured — none of them silently pretend to work.

## Environment Variables

All environment variables are server-only and must never be prefixed with `NEXT_PUBLIC_` unless they are meant to reach the browser (only `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SOCKET_URL` are). The full, commented list with every variable used across the app lives in [`.env.example`](.env.example) — copy it to `.env.local` and fill in real values. Never commit `.env.local`, and never put real credentials in `.env.example` or this README.

Variables relevant to the features documented here:

```env
# Database
DATABASE_URL=

# Admin auth (src/lib/auth/)
JWT_ACCESS_SECRET=replace_with_a_long_random_string
TOKEN_HASH_PEPPER=replace_with_a_different_long_random_string
APP_URL=
NEXT_PUBLIC_APP_URL=
ADMIN_INITIAL_EMAIL=replace_with_the_admin_email
ADMIN_INITIAL_PASSWORD=replace_with_a_strong_password

# Companies House bulk CSV import — native AWS S3 only, never R2/Wrangler
# (scripts/import-companies-house-s3.mjs, src/lib/companies/s3-source.ts)
COMPANIES_S3_URI=s3://your-bucket/BasicCompanyDataAsOneFile.csv
AWS_S3_BUCKET=your-bucket
AWS_S3_KEY=BasicCompanyDataAsOneFile.csv
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=replace_with_your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=replace_with_your_aws_secret_access_key
# AWS_S3_ENDPOINT=   # leave unset for native AWS S3; only for a non-AWS S3-compatible endpoint

# Transactional email (contact form, comment PIN emails, auth emails)
EMAIL_PROVIDER=resend
RESEND_API_KEY=replace_with_your_resend_api_key
CONTACT_FROM_EMAIL="Dominic Wokorach Portfolio <no-reply@example.com>"
CONTACT_TO_EMAIL=replace_with_the_inbox_that_should_receive_enquiries
```

| Variable | Used by | Required for |
| --- | --- | --- |
| `DATABASE_URL` | `prisma/schema.prisma`, `src/lib/database/db.ts` | Everything database-backed: admin auth, comments, chat, company data |
| `JWT_ACCESS_SECRET` | `src/lib/auth/tokens.ts`, `src/middleware.ts` | Admin auth (access tokens) |
| `TOKEN_HASH_PEPPER` | `src/lib/auth/env.ts` | Hashing refresh/reset/email-change tokens |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | `src/lib/email/mailer.ts` callers, socket client | Absolute links in auth emails; client-side socket origin |
| `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` | `prisma/seed.ts` | Optional idempotent seeded super-admin (there is no public sign-up route) |
| `COMPANIES_S3_URI`, `AWS_S3_BUCKET`, `AWS_S3_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | `scripts/import-companies-house-s3.mjs`, `src/lib/companies/s3-source.ts` | Companies House S3 bulk import (see below) |
| `AWS_S3_ENDPOINT` | same as above | Only for a non-AWS S3-compatible endpoint — leave unset for native AWS S3 |
| `EMAIL_PROVIDER`, `RESEND_API_KEY` | `src/services/email/` | Sending any transactional email (contact receipts, comment PINs, auth emails) |
| `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | `src/app/api/contact/route.ts` | Contact-form submissions |

`.env.example` additionally documents variables for live chat (Socket.IO), the AI Search Assistant (OpenAI), the weather widget (OpenWeather), the portrait-animation demo (Runway) and translation (Google Cloud) — each optional and independent of the features covered in this README.

## Scripts

Actual scripts from `package.json`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server (`next dev`) |
| `npm run build` | `prisma generate` + `prisma migrate deploy`, then `next build` |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint over `src` and `scripts`, zero warnings allowed |
| `npm test` | Run the Jest test suite |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run test:ci` | Jest in CI mode (`--ci --coverage --runInBand`) |
| `npm run test:accessibility` | Playwright accessibility tests |
| `npm run import:companies:s3` | Stream-import the Companies House CSV from the configured AWS S3 object into `CompanyRecord` |
| `npm run auth:create-admin -- "<name>" <email> <password> [role]` | Provision or update an admin account (no public sign-up route) |
| `npm run db:seed` | Run `prisma/seed.ts` |
| `npm run setup:vector-store` | Upload the sample docs and create an OpenAI vector store for the AI Search Assistant |
| `npm run socket:dev` / `npm run socket:start` | Run the live-chat Socket.IO server (dev / prod) |
| `npm run email:dev` / `npm run email:dev:resume` | Preview email templates locally |
| `npx prisma migrate dev` | Apply Prisma schema changes locally, creating a new migration |
| `npx prisma migrate deploy` | Apply pending migrations without creating new ones (also run automatically by `npm run build`) |

The repository also has Cloudflare-Workers-oriented scripts (`preview`, `deploy`, `upload`, `cf-typegen`, using `@opennextjs/cloudflare`/`wrangler`) for an alternate deployment target. These are unrelated to the AWS S3 company-import feature, which deliberately never uses R2 or Wrangler bindings.

## Company Data & Search

The "Company (optional)" field on both the contact form and the public comment form is backed by a local, searchable mirror of Companies House's free ["Basic Company Data"](https://download.companieshouse.gov.uk/en_output.html) bulk CSV export — not a live external API call. The whole dataset lives in the `CompanyRecord` Postgres table and is never shipped to the browser; only up to 10 matching rows per query are returned to the client.

### How it works

- **Search UI**: `src/components/companies/CompanySearchField.tsx` — a single shared combobox component used by both `src/components/sections/Contact.tsx` and `src/components/comments/CommentForm.tsx`. It debounces input (300ms), cancels the in-flight request (`AbortController`) when the query changes, and shows loading, no-results and error states. If nothing in the dataset matches, the field offers "Enter it manually" so the form always accepts free-text company names.
- **Search API**: `GET /api/companies/search` (`src/app/api/companies/search/route.ts`), backed by `src/lib/companies/search.ts`, reading `CompanyRecord`.
- **Data model**: `CompanyRecord` (`prisma/schema.prisma`) — `companyNumber` is a unique string column (never parsed as a number, so leading zeroes like `"01234567"` are preserved), with indexes on `name`, `nameNormalized` and `postcodeNormalized`.
- **Bulk import**: `scripts/import-companies-house-s3.mjs`, streaming directly from a private AWS S3 object — see below.
- **Admin CSV upload**: a smaller, admin-only manual replace flow at `POST /api/admin/companies/import` for uploading a CSV directly (max 15 MB) instead of running the S3 script.

### AWS S3 import process

The 3 GB Companies House CSV is never downloaded into the Next.js server process or shipped to the browser. It is streamed directly from a **private, native AWS S3 object** by a standalone Node.js CLI script — never through an HTTP request/response cycle, which would exceed any request timeout.

- **Source**: configured entirely by `COMPANIES_S3_URI` / `AWS_S3_BUCKET` / `AWS_S3_KEY` / `AWS_REGION` (`src/lib/companies/s3-source.ts`). The three values are cross-checked against each other at startup; a mismatch stops the run rather than silently "correcting" the bucket or key.
- **Native AWS S3 only**: `AWS_REGION` is required (there is no R2-style `"auto"` region default), and `AWS_S3_ENDPOINT` is left unset for a normal AWS S3 bucket — it exists only to point the SDK at a non-default, S3-compatible endpoint, and is never used by the actual import path. No Cloudflare R2 endpoint or Wrangler binding is used anywhere in this feature.
- **Streaming, not buffering**: the script reads the S3 object as a byte stream and splits it into CSV lines without ever holding the whole file in memory, upserting rows in batches of 2,000.
- **Resumable**: after every batch, the script checkpoints its byte offset, parsed header layout, and row/reject counts to a `CompanyImportRun` row. Re-running the script while a `"running"` row exists for the same source resumes with an S3 `Range` GET from that byte offset instead of restarting.
- **Idempotent / deduplicated**: every row is an `UPSERT … ON CONFLICT (companyNumber)`, so re-processing already-imported lines (after a resume, or a second run) never creates duplicates. `companyNumber` is a required unique column.
- **Previous dataset preserved on failure**: each import run is tagged with a `generation`. Stale rows from an older generation are deleted only after the new run reaches `"succeeded"` — a failed or interrupted run leaves the previously-imported dataset fully intact and searchable.
- **Admin-only**: the import script itself has no HTTP surface. The only web-facing pieces are admin-authenticated: `GET/POST /api/admin/companies/import/s3` (`src/app/api/admin/companies/import/s3/route.ts`), which reports the last/running `CompanyImportRun` and does a cheap `HeadObject` reachability check, and `src/components/admin/companies/CompaniesImportView.tsx`, the admin panel that displays this. Neither performs the transfer itself, and neither ever exposes the bucket credentials, a signed URL, or the CSV contents to the browser — only status/counts.

### Running the import

```bash
npm run import:companies:s3
```

This runs `node --env-file=.env.local scripts/import-companies-house-s3.mjs`, which requires `COMPANIES_S3_URI`, `AWS_S3_BUCKET`, `AWS_S3_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to be set (see [Environment Variables](#environment-variables)). Pass `--no-replace` to skip deleting the previous generation's rows after a successful import.

### Search endpoint

```
GET /api/companies/search?q=<term>
```

- `q` — 2–160 characters, or a single letter (`A`–`Z`) for an A–Z browse filter. Shorter queries return an empty result set rather than an error.
- Matches, in priority order, against an exact registration-number match, an exact company-name match, a company-name prefix match, an exact postcode match (space-insensitive), then a substring company-name match.
- Rate-limited to 30 requests/minute per IP.

Response body:

```json
{
  "companies": [
    {
      "id": "cmxxxxxxxx",
      "name": "EXAMPLE COMPANY LTD",
      "companyNumber": "01234567",
      "status": "active",
      "type": "ltd",
      "dateOfCreation": "1999-01-01T00:00:00.000Z",
      "address": { "postalCode": "SW1A 2AA", "locality": "London" },
      "postcode": "SW1A 2AA",
      "location": "London, SW1A 2AA",
      "sicCodes": ["62012"],
      "source": "companies-house"
    }
  ],
  "totalResults": 1
}
```

On a soft failure (rate limit, provider/database error) the response still has a `companies: []` array plus an `error` string, so a failing lookup never blocks the surrounding contact/comment form from being submitted with a manually-typed company name.

- **Result limit**: **10** companies per request (`COMPANY_SEARCH_RESULT_LIMIT` in `src/lib/companies/search.ts`), regardless of how many rows match — the endpoint cannot be used to page through and reconstruct the full dataset.

### Admin-only manual CSV upload

`POST /api/admin/companies/import` accepts a `multipart/form-data` upload (`file`, ≤ 15 MB, `.csv`) and fully replaces the `CompanyRecord` table in a single transaction — a smaller alternative to the S3 bulk import for ad hoc updates. `GET` on the same route returns the current row count. Both require an authenticated admin session (`requireAdminApi`).

## Database Migrations

```bash
# Apply pending migrations (production / CI — this also runs automatically as part of `npm run build`)
npx prisma migrate deploy --schema prisma/schema.prisma

# Create and apply a new migration while developing locally
npx prisma migrate dev --schema prisma/schema.prisma

# Regenerate the Prisma Client after pulling schema changes
npx prisma generate --schema prisma/schema.prisma

# Seed a fixed super-admin account idempotently (ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD)
npm run db:seed
```

`CompanyRecord` and `CompanyImportRun` (the tables behind company search and import tracking) are part of the same Prisma schema (`prisma/schema.prisma`) as every other model — there is no separate migration path for them.

## Admin Dashboard & Authentication

The `/admin/*` dashboard (live chat, comment moderation, account, settings, devices) uses its own JWT + server-side session authentication system (`src/lib/auth/`) — not a third-party auth provider. There is no public sign-up route; admin accounts are provisioned directly.

1. Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `TOKEN_HASH_PEPPER` and `NEXT_PUBLIC_APP_URL` in `.env.local`.
2. Apply the schema: `npx prisma migrate deploy`.
3. Create the first admin account:
   ```bash
   npm run auth:create-admin -- "Your Name" you@example.com "a-strong-password" SUPER_ADMIN
   ```
4. Sign in at `/auth/sign-in`. Change the generated password immediately from Settings → Security.

Password-reset, email-change-verification, password-changed, email-changed and new-device-sign-in emails are sent via Resend (`RESEND_API_KEY`). Without it set, emails are logged to the console instead of sent — fine for local development.

The same admin session guard (`requireAdminApi` / `getAdminSession`, `src/lib/auth/guard.ts`) restricts both company-import routes (`/api/admin/companies/import`, `/api/admin/companies/import/s3`) to authenticated administrators — an unauthenticated request receives `401 Unauthorized`.

## Tech Stack

### Frontend

- Next.js (App Router), React, TypeScript
- Tailwind CSS, Framer Motion, Lucide React
- Radix UI / `@base-ui/react` primitives, Embla Carousel

### Backend & data

- Next.js Route Handlers (Node.js runtime)
- Prisma ORM over PostgreSQL
- Socket.IO (live chat server)
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`) for the Companies House S3 import

### AI

- OpenAI API — Responses API + File Search over a vector store

### External APIs

- OpenWeather API
- Companies House bulk data export (imported, not called live)

### Testing

- Jest + Testing Library (unit/integration)
- Playwright + `@axe-core/playwright` (accessibility)

### Hosting

- Vercel (primary); Cloudflare Workers via `@opennextjs/cloudflare` as an alternate target

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── companies/           # Company search + profile lookup
│   │   ├── admin/companies/     # Admin-only S3 status/trigger + manual CSV upload
│   │   ├── contact/             # Contact-form submission
│   │   ├── comments/            # Public comment PIN-verification flow
│   │   ├── admin/, auth/        # Admin session, auth flows
│   │   ├── chat/, live-chat/    # AI Search Assistant + live-chat token/history
│   │   └── weather/             # OpenWeather proxy endpoint
│   ├── admin/                   # Admin dashboard pages
│   ├── projects/[slug]/         # Freelance project & case-study detail pages
│   └── layout.tsx, page.tsx, sitemap.ts, robots.ts
│
├── components/
│   ├── companies/                # CompanySearchField (shared contact/comment lookup)
│   ├── admin/companies/          # CompaniesImportView (admin S3 import panel)
│   ├── sections/, comments/       # Home-page sections incl. Contact, public CommentForm
│   ├── layout/, project/, gallery/, experience/, weather/, ui/
│
├── lib/
│   ├── companies/                 # search.ts, s3-source.ts, csv-import.ts, sic.ts
│   ├── auth/                      # JWT/session admin auth
│   └── database/                  # Prisma client
├── data/                           # Typed portfolio content
└── types/                          # Shared TypeScript types

scripts/
├── import-companies-house-s3.mjs   # Streaming AWS S3 → CompanyRecord import
├── import-companies-house-csv.mjs  # Local-file variant of the same import
├── lib/companies-house-csv.mjs     # Shared CSV parsing helpers
└── create-admin.mjs, setup-vector-store.mjs, ...

prisma/schema.prisma                # CompanyRecord, CompanyImportRun, auth, comments, chat models
docs/sample-knowledge-base/         # Fictional documents used by the AI Search Assistant demo
```

## Security

- **Admin-only mutation routes**: both company-import endpoints and the CSV upload route require an authenticated admin session (`requireAdminApi`); a missing/invalid session gets `401`.
- **No credentials or private data reach the browser**: the S3 bucket name, key, region and AWS credentials are read server-side only; the admin status endpoint returns a run's status/row counts, never a signed URL or the file contents. Company search responses never include more than the fields listed above, and are capped at 10 rows per request.
- **Safe error logging**: S3 failures are logged/returned as a categorized reason (`access_denied`, `no_such_bucket`, `no_such_key`, `region_mismatch`, `expired_credentials`, `unknown`) plus bucket/key/region/AWS request ID — never the access key, secret key, or raw AWS error body (`src/lib/companies/s3-source.ts`, `safeS3ErrorLogFields`).
- **Source allow-listing**: the admin import form can only trigger the exact, server-configured `COMPANIES_S3_URI` — there is no code path that accepts an operator-supplied bucket or key at request time.
- **Secrets stay in `.env.local`**: never commit it, and never put real values in `.env.example` or this README — `.env.example` only ever contains placeholders.

## Deployment

The portfolio is deployed through Vercel and connected to the production domain:

<https://www.dominicwokorach.me/>

`npm run build` runs `prisma generate` + `prisma migrate deploy` before `next build`, so pending migrations are applied automatically on deploy. Set every variable listed in [Environment Variables](#environment-variables) in the hosting provider's environment configuration before deploying — the company-search feature degrades to a visible "Unable to load companies" state (not a crash) if `DATABASE_URL` or the dataset is missing, and the S3 import script simply refuses to run if its AWS variables are missing.

The repository also includes an alternate Cloudflare Workers deployment path (`wrangler.jsonc`, `open-next.config.ts`, `npm run preview`/`deploy`/`upload`) — unrelated to, and not used by, the AWS S3 company-import feature.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Import script exits with `AccessDenied` / `access_denied` category | The IAM user/role behind `AWS_ACCESS_KEY_ID` lacks `s3:GetObject`/`s3:HeadObject` on the exact object, or the access key is not a valid AWS IAM key (e.g. a Cloudflare R2 token was used instead) | Grant the IAM policy the two actions on `arn:aws:s3:::<bucket>/<key>`, and confirm `AWS_ACCESS_KEY_ID` is a genuine AWS key (`AKIA…`/`ASIA…`, 20 chars) — not an R2 or other provider's token |
| `NoSuchBucket` | `AWS_S3_BUCKET` (and the bucket in `COMPANIES_S3_URI`) doesn't exist in `AWS_REGION` | Confirm the bucket name and that it exists in the configured region |
| `NoSuchKey` | The object at `AWS_S3_KEY` doesn't exist in the bucket | Confirm the exact key (including case) matches what was uploaded |
| Wrong region / redirect (301/307) | `AWS_REGION` doesn't match the bucket's actual region | Set `AWS_REGION` to the bucket's real region — AWS S3 has no region-less "auto" mode |
| `ExpiredToken` / `InvalidAccessKeyId` / `SignatureDoesNotMatch` | Credentials are invalid, rotated, or malformed | Re-issue an AWS access key/secret pair for the IAM user and update `.env.local` |
| Import fails partway through | Any of the above, or a transient network error | The previous dataset is untouched — the run is retried automatically (up to 5 attempts per operation) and, on eventual failure, marked `"failed"` on its `CompanyImportRun` row with the byte offset to resume from. Re-run `npm run import:companies:s3` |
| Company search shows "Unable to load companies" | The `/api/companies/search` request failed — usually `DATABASE_URL` misconfigured, the database unreachable, or the request was rate-limited | Check `DATABASE_URL` and database connectivity; check server logs for `[api/companies/search]` entries; the form still accepts a manually-typed company name regardless |
| Admin import panel shows `401` | No authenticated admin session | Sign in at `/auth/sign-in` with an account created via `npm run auth:create-admin` |
| Admin CSV upload rejects a file | File isn't `.csv`, is over 15 MB, is empty, or looks like binary content | Export as plain CSV under 15 MB; use the S3 bulk-import script for the full multi-GB dataset instead |

## Accessibility

The portfolio is designed with accessibility in mind, including:

- Semantic HTML, keyboard-accessible controls (including the company-search combobox: arrow keys, Enter, Escape)
- Visible focus states and accessible form labels
- `aria-live` status announcements for search loading/results/error states
- Responsive typography and sufficient colour contrast
- Reduced-motion preferences respected throughout
- Descriptive alternative text

Verified with `npm run test:accessibility` (Playwright + `@axe-core/playwright`).

## Performance

- `next/image` for local screenshots with responsive `sizes`
- Lazy loading and responsive Cloudinary transformations for gallery images
- Debounced, cancellable company search requests (no request storm while typing)
- Framer Motion animations limited to `transform`/`opacity`, with `prefers-reduced-motion` respected throughout
- Static generation for the home page and every project/case-study detail route via `generateStaticParams`

## Contributors

This project is currently independently designed, developed and maintained by **Dominic Wokorach**.

External contributions may be accepted through pull requests.

## Contributing

Contributions, suggestions and bug reports are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint`, `npm test` and `npm run build`
5. Commit your work
6. Push the branch
7. Open a pull request

Please keep contributions focused, accessible and consistent with the existing project structure. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style and testing details.

## License

This project is licensed under the MIT License.
See [LICENSE](LICENSE) for details.

## Author

**Dominic Wokorach**

Software Engineer & Frontend Developer

- Portfolio: <https://www.dominicwokorach.me/>
- GitHub: <https://github.com/domwokorach>
- LinkedIn: <https://www.linkedin.com/in/dominic-w-3673523b/>
