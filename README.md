# Dominic Olanya — Portfolio

A personal developer portfolio with an editorial cream/navy design: hero, skills, projects,
experience timeline, achievements ("Proud moments") and a contact form that emails enquiries,
saves them to PostgreSQL and (optionally) stores attachments in Amazon S3.

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- Plain CSS per section (no Tailwind), **motion** for animation, a little **three.js** (hero light trails, loaded on demand)
- **Prisma ORM 7** + **PostgreSQL** (`@prisma/adapter-pg`) — contact enquiries
- **Resend** — contact form email
- **AWS S3** (SDK v3, presigned uploads) — contact attachments, optional
- Media served from **Cloudinary**; icons from Simple Icons / Tabler / logos, built offline

## Getting started

Requires Node.js 20.19+ and npm.

```bash
git clone <repository-url>
cd video-portfolio-rebuild
npm install            # also generates the Prisma Client (postinstall)
cp .env.example .env   # then fill in your own values (see below)
npm run dev
```

Open http://localhost:3000/en-gb (`/` redirects there).

The site runs without any environment variables: the pages work, and the contact form shows its
error state (the API returns 503) until email is configured. **Provide your own values** — no
credentials are included in this repository.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build (first regenerates icons and Prisma Client) |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
| `npm run icons` | Rebuild `src/data/stack-icons.ts` from the icon ids used in `src/data/` |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create/apply migrations in development (`prisma migrate dev`) |
| `npm run db:deploy` | Apply committed migrations in production (`prisma migrate deploy`) |
| `npm run db:studio` | Browse the database locally (never expose in production) |

## Environment variables

All are **server-side only** — never prefix them with `NEXT_PUBLIC_`. See `.env.example`.

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Metadata (recommended in production) | Public origin, e.g. `https://www.dominicwokorach.me` |
| `RESEND_API_KEY` | Contact email | Resend API key |
| `CONTACT_TO_EMAIL` | Contact email | Where enquiries are delivered |
| `CONTACT_FROM_EMAIL` | Contact email (optional) | Sender on a domain verified in Resend. Defaults to Resend's onboarding sender, which only delivers to your own Resend account address |
| `DATABASE_URL` | Saving enquiries (optional) | PostgreSQL connection string |
| `DATABASE_SCHEMA` | Saving enquiries (optional) | Postgres schema for this app's tables, default `portfolio` |
| `AWS_REGION` | S3 attachments (optional) | e.g. `eu-west-2` |
| `AWS_S3_BUCKET_NAME` | S3 attachments (optional) | Private bucket. Without it, files ≤ 4 MB are attached to the email instead |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 attachments, local only | In production prefer an IAM role / OIDC |

## Database setup (Prisma)

The schema is `prisma/schema.prisma`; migrations are committed in `prisma/migrations/`.
`prisma.config.ts` reads `DATABASE_URL` and pins every Prisma command to the `DATABASE_SCHEMA`
schema (default `portfolio`), so this app only ever creates or changes tables in its own schema,
even on a shared database.

```bash
# development: apply migrations (and create new ones after editing the schema)
npm run db:migrate
# production / CI: apply the committed migrations only
npm run db:deploy
```

Storage is best-effort: if the database is unavailable, enquiries are still emailed and the
error is only logged. Each submission carries an id, so retries never create duplicate rows or
duplicate emails.

## Contact form

`POST /api/contact` re-validates every field (shared rules in `src/lib/contact.ts`), rejects a
hidden honeypot field, rate-limits bursts per IP, saves the enquiry (Prisma) and emails it
(Resend). Attachments: with S3 configured, the browser gets a 5-minute presigned URL from
`POST /api/upload` and uploads straight to the private bucket (≤ 10 MB); the contact route then
re-checks the stored object (key pattern, size, leading bytes) and emails a 7-day download link.
Bucket setup (CORS, least-privilege IAM, lifecycle): [`docs/S3_SETUP.md`](docs/S3_SETUP.md).

Prisma, Resend and the AWS SDK are only imported by server modules (`src/lib/*.server.ts` and
`src/app/api/`), so none of them, and no credentials, reach the browser bundle.

## Project structure

```
src/
├── app/            Next.js routes: layout, home page, legal pages, api/contact, api/upload
├── views/          Page compositions (HomeView; legal pages)
├── components/     Sections (hero, skills, projects, experience, learning, contact, layout…)
│   └── ui/         Shared and adapted third-party components (see below)
├── composables/    React hooks (active section, media queries, reveal-on-scroll…)
├── config/         Site metadata, nav items, media queries, hero poses, legal facts
├── data/           Content (skills, projects, experience, achievements, contact) + generated icons
├── lib/            Helpers; *.server.ts modules hold Prisma, Resend and S3 (server only)
├── styles/         CSS per section, imported in cascade order from app/layout.tsx
└── types/          Shared TypeScript types
prisma/             schema.prisma and migrations
docs/               Setup notes (S3)
```

## Common changes

- **Content** lives in `src/data/` (skills, projects, experience, achievements, contact details).
- **Technology icons**: set an Iconify id on the item in `src/data/core-tech.ts` (`simple-icons:…`, `logos:…` or `tabler:…`, plus an optional brand `color`), then run `npm run icons`. The script fails on unknown ids and writes only the icons in use; don't edit `stack-icons.ts` by hand.
- **Styles**: one file per section in `src/styles/`; import order in `src/app/layout.tsx` matters.

## Privacy, cookies and legal pages

The site sets **no cookies** and loads **no analytics or tracking**; the only browser storage is
the cookie-consent choice in localStorage. If you add an optional script, load it through
`whenConsented()` from `src/lib/consent.ts` and list it on the Cookie page.

The legal pages describe what the code does. Before publishing, set the two operational facts in
`src/config/legal.ts` (they show as "to be confirmed" until then): `hostingProvider` and
`enquiryRetention`.

## Third-party components

Copied/adapted rather than installed with a CLI (the shadcn CLI would add Tailwind and its global
reset). Each file notes its source and changes at the top.

| File | Source |
|---|---|
| `components/ui/LogoLoop.tsx/.css` | React Bits LogoLoop |
| `components/ui/timeline.tsx` | Aceternity UI Timeline |
| `components/ui/animated-testimonials.tsx` | Aceternity UI Animated Testimonials (React original of Inspira UI's) |
| `components/ui/rubber-segment.tsx` | Vue Bits RubberSegment, ported to React |
