# Résumé download with email verification

The **Resume** buttons (hero, About, Portfolio Access confirmation) open a dialog: full name, email, company → a six-digit PIN and one-time link are emailed → entering the PIN (or opening the link) verifies the email → the PDF downloads automatically, with a **Download Resume** button as fallback. No admin approval is involved; every request appears in **Admin → Sessions → Résumé requests**.

## How it works

| Endpoint | Purpose |
| --- | --- |
| `POST /api/resume/request` | Validates, creates/updates the record (one per email), emails PIN + link. Same answer whether or not the email was seen before; `502` if the email could not be sent. |
| `POST /api/resume/verify` | `{ id, pin }` or `{ token }`. Marks the record `VERIFIED` and sets an HTTP-only, `SameSite=Strict` grant cookie (15 min). |
| `POST /api/resume/resend` | New code; 60 s cooldown, at most 4 emails per hour. |
| `GET /api/resume/download` | Streams the PDF only with a valid grant; counts and timestamps each download. |

- PIN and link token: random, 10-minute expiry, single use, 5 wrong PINs burn the code. Only HMAC-SHA256 hashes are stored (key: `RESUME_HASH_SECRET`); raw values are never logged or stored.
- The emailed link carries the token in the URL **fragment** (`/en-gb/resume/verify#t=…`) and the page POSTs it, so mail scanners that only fetch the URL cannot use it up.
- The PDF lives in Postgres (`ResumeFile`, single row `current`), never at a public URL. The old public Google Drive link and the `/Dominic_Wokorach_Olanya_CV.pdf` redirect were removed; the redirect now goes to the portfolio.
- Models: `ResumeAccess` (record + lifecycle), `ResumeEvent` (audit trail), `ResumeFile`. Admin statuses: Pending Verification, Email Sent, Verified, Downloaded, Expired (derived from expiry), Delivery Failed.
- Device info: User-Agent and Client Hints only; model shown as "Unknown device model" when not reliably disclosed. IP only from trusted proxy headers (`trustedClientIp`).
- Retention: 365 days after last activity (`npm run resume:purge`, run periodically). Privacy notice updated.

## Company field

The résumé form's Company field is the shared `CompanyField` (variant `resume`, suggestions mounted inside the dialog), backed
by live Companies House search plus the company database (see `docs/COMPANIES.md`). On submit the browser sends only the text and,
if a suggestion was picked, its registration number; **the server looks the number up again** (`resume-company.server.ts`) and
stores the official name, number, status, registered address, source (`companies_house` live, `company_database` saved and not
checked live, `manual` typed by hand) and the live check time with the `ResumeAccess` record. An unknown number is dropped and the
typed name kept, so non-UK organisations work. A company registration shows the company exists; it does not show the visitor
works there. Admin → Sessions shows number, status, address and the source label.

## Setup / deployment

1. Env var (Production, Sensitive): `RESUME_HASH_SECRET` — at least 32 random characters (`openssl rand -base64 48`). Existing: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `DATABASE_URL`.
2. Apply the migrations `20261012200000_resume_verification` and `20261013110000_resume_company` (`npm run db:deploy`) and, for the company database, `20261013100000_company_verified_at` (`npm run companies:migrate`) — **needs approval for production**.
3. Load the PDF: `npm run resume:import -- path/to/resume.pdf` (uses `DATABASE_URL`; check which database that is).
4. In Google Drive, set the old résumé file to **Restricted**, otherwise the public link still works for anyone who has it.

## Testing

- `npm test` runs (serially) unit tests (validation, device detection, hashing, email, no public link, no server imports in client code).
- `tests/resume-flow.test.ts`, `tests/resume-company.test.ts` and `tests/companies-db.test.ts` run the real route handlers against Postgres and needs a throwaway database: `TEST_DATABASE_URL=postgres://… npm test` (migrations applied). It is skipped otherwise. Never point it at production: it deletes all `ResumeAccess` rows.
- Local development without a mailbox: `RESUME_DEV_MAIL_FILE=/tmp/mail.jsonl npm run dev` writes the emails to that file (development mode only).
