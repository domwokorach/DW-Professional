# Company data (optional)

Powers the contact form's **Company (optional)** field: as a visitor types, it suggests registered
UK companies; picking one records the company number, and the server checks it with Companies
House. The field always accepts a name typed by hand, and if nothing here is configured it is a plain
text input.

```
Companies House bulk CSV ──▶ S3 ──(npm run companies:import, by hand)──▶ company database
company database ──▶ GET /api/companies/search ──▶ Company field suggestions (debounced)
picked company ──▶ GET /api/companies/verify ──▶ Companies House API (live), else the imported record
contact form ──▶ /api/contact stores companyNumber + status + registered address with the enquiry
```

The CSV is only an import source: searches never read it.

## Switches

| Variable | Enables |
|---|---|
| `AWS_REGION`, `AWS_S3_BUCKET` + `AWS_S3_KEY` (or `COMPANIES_S3_URI`) | Reading the CSV from S3 (the importer) |
| `COMPANY_DATABASE_URL` | The database, the search API (suggestions) and the importer's writes |
| `COMPANIES_HOUSE_API_KEY` | Live verification of a picked company (otherwise the imported record is used) |

Missing values disable the feature quietly: the search API answers 404 and the importer says what
is missing. See `.env.example` for all variables. `AWS_S3_BUCKET`/`AWS_S3_KEY` (company dataset)
are separate from `AWS_S3_BUCKET_NAME` (contact attachments). Don't set `AWS_S3_ENDPOINT` for native
AWS S3; it is for S3-compatible stores such as Cloudflare R2 only (they use `AWS_REGION="auto"`).

## Setup

```bash
# 1. Create the tables, in their own schema (default "companies"); never touches other schemas.
#    Also installs pg_trgm into that schema for word and typo matching (skipped, with prefix-only
#    search, where the extension isn't available)
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
`IncorporationDate`/`DissolutionDate` (dd/mm/yyyy or yyyy-mm-dd), `RegAddress.AddressLine1/2`,
`RegAddress.PostTown`, `RegAddress.County`, `RegAddress.Country`, `RegAddress.PostCode` and
`SICCode.SicText_1`…`_4` are used when present. This matches the Companies House basic company data
format; check it against your file with `--dry-run` before importing. Company numbers are kept as
text, so leading zeros survive (`00445790`). Rows without a valid number or name are skipped and
counted. **Any CSV parse error (such as an unbalanced quote) stops the import** instead of skipping,
because the parser can silently drop every line after one. Each batch is one statement, so a failure
never leaves a half-written batch; re-running continues safely (upserts on company number).

A newer dataset: upload it to S3, change `AWS_S3_KEY` (or `COMPANIES_S3_URI`) and run the import
again. Companies already present are updated; none are duplicated.

## Search API

`GET /api/companies/search?q=lloyds[&limit=10]` → `{ "companies": [{ companyNumber, companyName, companyStatus, address, locality }] }`

- `q`: 2 to 60 characters (letters, digits, spaces and `& ' . , ( ) / + ! @ -`). Names are compared
  in a normalised form (case and accents folded, `&` as "and", other punctuation as spaces), so
  `Marks & Spencer`, `J. Sainsbury` and `TESCO plc` all match.
- Ranking: company number (`445790`, `SC95000`), exact name, name starts with the query, a word
  starts with the query ("banking group"), then close matches for typos ("tesko"), which ignore
  generic words like LIMITED or PLC. Active companies and shorter names first within each tier.
- Only indexed lookups (primary key, `text_pattern_ops` btree, `pg_trgm` GIN), a 2.5 s statement
  timeout, at most 10 results, 60 requests per minute per IP, cached for 5 minutes.
- Errors: `400` invalid input, `404` feature not configured (the field then stops suggesting),
  `429` rate limited, `503` database unavailable (the field says suggestions are unavailable and
  keeps working as a text input). Responses never contain connection details; logs hold only an error code.

## Verification (Companies House API)

`GET /api/companies/verify?number=00445790` → `{ "company": {…}, "verified": true }`

Called once when a visitor picks a suggestion. The server asks
`https://api.company-information.service.gov.uk/company/{number}` with `COMPANIES_HOUSE_API_KEY`
(Basic auth; the key never reaches the browser), caches answers for an hour per instance, and
refreshes the imported row with the live details. If the live API is unavailable or not configured,
the imported record is returned with `verified: false`, and the visitor's pick is kept either way.
20 requests per minute per IP. The contact route repeats the lookup itself when an enquiry arrives,
so the stored status and address never come from the browser.

## Security

- All of this is server-side. None of the variables is a `NEXT_PUBLIC_*` variable.
- **Use credentials created for this purpose, with least privilege**: for S3 only
  `s3:GetObject` on the one object (`arn:aws:s3:::<bucket>/<key>`). On Vercel prefer OIDC to AWS
  (short-lived credentials, no stored keys) over a long-lived access key.
- Keys that have been pasted into chat, email or a ticket should be rotated before use.
- Never commit `.env*` files (`.gitignore` blocks them); check before pushing:
  `git ls-files | grep -E "\.env"` should list only `.env.example`.
