# Company data (optional)

An optional, server-side-only feature: a company CSV stored in S3 is imported into its own
PostgreSQL database and searched through `GET /api/companies/search`. Nothing here runs unless it
is configured, and the portfolio pages never read the CSV or the database.

```
S3 CSV ──(npm run companies:import, run by hand)──▶ company database ──▶ /api/companies/search
```

## Switches

| Variable | Enables |
|---|---|
| `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_S3_KEY` | Reading the CSV from S3 (the importer) |
| `COMPANY_DATABASE_URL` | The database, the search API and the importer's writes |

Missing values disable the feature quietly: the search API answers 404 and the importer says what
is missing. See `.env.example` for all variables. `AWS_S3_BUCKET`/`AWS_S3_KEY` (company dataset)
are separate from `AWS_S3_BUCKET_NAME` (contact attachments). Don't set `AWS_S3_ENDPOINT` for native
AWS S3; it is for S3-compatible stores such as Cloudflare R2 only (they use `AWS_REGION="auto"`).

## Setup

```bash
# 1. Create the tables, in their own schema (default "companies"); never touches other schemas
npm run companies:migrate

# 2. Check the CSV without writing anything
npm run companies:import -- --dry-run

# 3. Import (streams the file; safe to re-run: upserts on company number)
npm run companies:import
```

Other importer options: `--file ./local.csv` (use a local file instead of S3) and `--limit 1000`
(stop after N rows). The importer is never part of `build` or a deploy. It prints the target
database host (never credentials) before writing.

## The CSV

Headers are matched by name, ignoring case and spaces: `CompanyNumber` and `CompanyName` are
required (the import refuses to start without them); `CompanyStatus`, `CompanyCategory`,
`IncorporationDate` (dd/mm/yyyy or yyyy-mm-dd), `RegAddress.PostTown`, `RegAddress.PostCode` and
`SICCode.SicText_1` are used when present. This matches the Companies House basic company data
format; check it against your file with `--dry-run` before importing. Rows without a valid number or
name are skipped and counted. **Any CSV parse error (such as an unbalanced quote) stops the import**
instead of skipping, because the parser can silently drop every line after one.

## Search API

`GET /api/companies/search?q=acme&page=1&limit=10`

- `q`: 2 to 60 characters (letters, digits, spaces and `& ' . , ( ) / + ! -`).
- A company number (`445790` or `SC123456`) is an exact match; any query also matches company names
  by **prefix** (kept to prefix so it stays fast on millions of rows).
- `limit` at most 20, `page` at most 50, 30 requests per minute per IP, results cached for 5 minutes.
- Returns only `companyNumber`, `companyName`, `status`, `companyType`.
- Errors: `400` invalid input, `404` feature not configured, `429` rate limited, `503` database
  unavailable. Responses never contain connection details; logs hold only an error code.

There is deliberately no UI: the portfolio doesn't show company search. If you add one, render it
only when the feature is configured.

## Security

- All of this is server-side. None of the variables is a `NEXT_PUBLIC_*` variable.
- **Use credentials created for this purpose, with least privilege**: for S3 only
  `s3:GetObject` on the one object (`arn:aws:s3:::<bucket>/<key>`). On Vercel prefer OIDC to AWS
  (short-lived credentials, no stored keys) over a long-lived access key.
- Keys that have been pasted into chat, email or a ticket should be rotated before use.
- Never commit `.env*` files (`.gitignore` blocks them); check before pushing:
  `git ls-files | grep -E "\.env"` should list only `.env.example`.
