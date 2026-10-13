-- When a row was last confirmed against the live Companies House API. A row with a value here is newer than any
-- bulk CSV, so imports leave it alone (see upsertCompanies in src/lib/company-db.server.ts).
ALTER TABLE "Company" ADD COLUMN "verifiedAt" TIMESTAMP(3);
