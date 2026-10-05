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
| `npm run db:seed` | Create the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (same as `npx prisma db seed`; see [Admin sign-in](#admin-sign-in-adminlogin)) |
| `npm run admin -- <command>` | Create and manage admin accounts for comment moderation at `/admin/comments` (see [`docs/COMMENTS.md`](docs/COMMENTS.md)) |

## Environment variables

All are **server-side only** — never prefix them with `NEXT_PUBLIC_`. See `.env.example`.

| Variable | Needed for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Metadata (recommended in production) | Public origin, e.g. `https://www.dominicwokorach.me` |
| `RESEND_API_KEY` | Contact email | Resend API key |
| `CONTACT_TO_EMAIL` | Contact email | Where enquiries are delivered |
| `CONTACT_FROM_EMAIL` | Contact email (optional) | Sender on a domain verified in Resend. Defaults to Resend's onboarding sender, which only delivers to your own Resend account address |
| `DATABASE_URL` | Saving enquiries (optional) | PostgreSQL connection string |
| `PORTFOLIO_DATABASE_URL` | Saving enquiries (optional) | Takes precedence over `DATABASE_URL`; use it when `DATABASE_URL` belongs to another app |
| `DATABASE_SCHEMA` | Saving enquiries (optional) | Postgres schema for this app's tables, default `portfolio` |
| `COMMENTS_NOTIFY_EMAIL` | Comments (optional) | Where new-comment moderation emails go, default `dominic.wokorach-o@outlook.com`. Comments need the migrations applied (`npm run db:deploy`): [`docs/COMMENTS.md`](docs/COMMENTS.md) |
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

## Admin sign-in (`/admin/login`)

There is **no default admin and no built-in password.** The sign-in page only works once you have created an
administrator, and you choose its email and password yourself.

**Local setup**

1. Add your own credentials to `.env` (it is not committed; never prefix these with `NEXT_PUBLIC_`):

   ```bash
   ADMIN_EMAIL="you@yourdomain.com"
   ADMIN_PASSWORD="a-strong-password-of-12-or-more-characters"
   ```

2. Make sure the database has the admin tables: `npm run db:migrate` (development) or `npm run db:deploy`.
3. Create the administrator: `npx prisma db seed` (or `npm run db:seed`).
4. Start the site (`npm run dev`) and open <http://localhost:3000/admin/login>.
5. Sign in with the email and password from step 1. You land on `/admin/comments`.

What the seed does: reads the two variables, refuses placeholder or weak values (the password needs 12+
characters), hashes the password with **Argon2id**, and creates the admin only if that email doesn't exist yet. The
plaintext password is never stored, logged or sent anywhere, so running the seed again never creates a duplicate:
it just says the admin already exists. Missing variables stop it with a clear message, and nothing is created
silently.

**Changing a password.** Either run the seed again with `ADMIN_RESET_PASSWORD=true` (it replaces that admin's
password and signs them out everywhere), or use `npm run admin -- reset-password <email>`, which asks for the new
one at a hidden prompt. `npm run admin -- list` shows who exists; the same command can deactivate an admin or sign
them out.

**Production.** Don't keep a plaintext password in the deployment environment. Apply migrations (`npm run
db:deploy`), run the seed **once** from a trusted machine with the production database URL and `ADMIN_*` set only
for that command, then delete `ADMIN_PASSWORD` from every `.env` and hosting setting. From then on the only copy of
the password is its hash in the database, and you manage it with `npm run admin -- ...`. Sign-in is rate limited,
every attempt is audit-logged, and sessions are server-side with an HttpOnly cookie.

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

## Portfolio Access (QR code → CV)

The QR code on the back of the Developer ID card is a real, scannable code that opens
`/en-gb/portfolio-access` (`src/views/portfolio-access/`), not the CV file itself; the bare
`/portfolio-access` redirects there. That page shows a short
loading animation, vibrates once where the browser supports it (Android Chromium; iOS has no
Vibration API), then offers **Open CV** and **Download CV**. The CV URL is defined once in
`src/config/portfolio-access.ts`; the page never embeds the `.docx`. The QR encodes
`NEXT_PUBLIC_SITE_URL` + `/en-gb/portfolio-access` (falling back to the live domain in production), so set
that variable correctly before printing or sharing the card.

## Privacy, cookies and legal pages

The site sets **no cookies** and loads **no analytics or tracking**; the only browser storage is
the cookie-consent choice and, once the visitor presses the theme button, their light/dark
preference (`portfolio-theme`), both in localStorage and both listed on the Cookie page. If you add an optional script, load it through
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
| `components/animate-ui/` (`icons/`, `primitives/`) | Animate UI icons (`npx shadcn@latest add @animate-ui/icons-download icons-link icons-send-horizontal icons-moon icons-sun`) used by the CTA links; driven by `components/ui/IconLink.tsx`, `layout/ThemeToggle.tsx` and `composables/useIconTrigger.ts`. The shadcn CLI mangles `viewBox` attributes here, so after re-running it, compare the files with the registry |
| `components/ui/hyper-text.tsx` | Magic UI Hyper Text (`npx shadcn@latest add @magicui/hyper-text`), the ID card's flip hint (`developer-id/FlipCaption.tsx`). Don't trust the CLI's copy: it strips the space in `letter === " "`, so compare with the registry after re-running it |
| `components/ui/{at-sign,map-pin,briefcase-business,send,download}.tsx` | Lucide Animated icons (`npx shadcn@latest add https://lucide-animated.com/r/<name>.json`) on the hero buttons and the Contact details rows (`contact/ContactInfoRow.tsx`); driven by `components/ui/IconButton.tsx` and `composables/useIconHandle.ts`. The shadcn CLI mangles `viewBox` in these too: compare with the registry after re-running it |
| `components/ui/confetti.tsx` | Magic UI Confetti (`npx shadcn@latest add @magicui/confetti`), on the "Always learning." heading via `animations/ConfettiOnInteract.tsx`. `ConfettiButton` is removed: the CLI would also add a shadcn `Button` and `radix-ui` for it |
| `components/ui/pulse-heart.tsx` + `.css` | Vue Bits PulseHeart, ported to React with plain CSS (the Vue installer can't be used here): the like heart on each comment card. The count roller and the star/thumb icons are left out |
| `components/loading-ui/fade-arc.tsx` | Loading UI Fade Arc (`npx shadcn@latest add @loading-ui/fade-arc`), the Portfolio Access loader |
