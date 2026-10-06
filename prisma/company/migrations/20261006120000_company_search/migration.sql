-- Company search: registered office address, dissolution date, all four SIC lines, import time,
-- and the indexes the Company field's autocomplete needs.

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "dissolutionDate" DATE,
ADD COLUMN "addressLine1" TEXT,
ADD COLUMN "addressLine2" TEXT,
ADD COLUMN "county" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "sicText2" TEXT,
ADD COLUMN "sicText3" TEXT,
ADD COLUMN "sicText4" TEXT,
ADD COLUMN "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_postcode_idx" ON "Company"("postcode");

-- Trigram index for word and fuzzy name matches. pg_trgm is installed into this schema (not
-- public), so nothing outside it changes. Where the extension isn't available the migration still
-- succeeds and search uses exact and prefix matching only (src/lib/company-db.server.ts checks).
DO $$
BEGIN
  EXECUTE format('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA %I', current_schema());
  EXECUTE format('CREATE INDEX IF NOT EXISTS "Company_nameSearch_trgm_idx" ON %I."Company" USING gin ("nameSearch" %I.gin_trgm_ops)', current_schema(), current_schema());
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm unavailable (%); company search will use prefix matching only', SQLERRM;
END
$$;
