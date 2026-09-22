-- Company search: normalized name/postcode columns, URI, and an
-- import-generation marker used to replace the dataset without
-- interrupting concurrent search (see scripts/import-companies-house-csv.mjs
-- and src/lib/companies/search.ts).

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "companyPostcode" TEXT;
ALTER TABLE "CommentVerification" ADD COLUMN "companyPostcode" TEXT;

-- AlterTable
ALTER TABLE "CompanyRecord"
  ADD COLUMN "nameNormalized" TEXT,
  ADD COLUMN "postcodeNormalized" TEXT,
  ADD COLUMN "uri" TEXT,
  ADD COLUMN "importGeneration" BIGINT NOT NULL DEFAULT 0;

-- Backfill existing rows before the NOT NULL constraint on nameNormalized
-- is enforced below.
UPDATE "CompanyRecord"
SET "nameNormalized" = lower(regexp_replace(trim("name"), '\s+', ' ', 'g')),
    "postcodeNormalized" = CASE
      WHEN "postalCode" IS NULL THEN NULL
      ELSE lower(regexp_replace("postalCode", '\s+', '', 'g'))
    END;

ALTER TABLE "CompanyRecord" ALTER COLUMN "nameNormalized" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CompanyRecord_nameNormalized_idx" ON "CompanyRecord"("nameNormalized");

-- CreateIndex
CREATE INDEX "CompanyRecord_postcodeNormalized_idx" ON "CompanyRecord"("postcodeNormalized");

-- CreateIndex
CREATE INDEX "CompanyRecord_importGeneration_idx" ON "CompanyRecord"("importGeneration");

-- Trigram support for the normalized name too, so prefix/fuzzy search
-- benefits from the same index whether it reads `name` or `nameNormalized`.
CREATE INDEX "CompanyRecord_nameNormalized_trgm_idx" ON "CompanyRecord" USING GIN ("nameNormalized" gin_trgm_ops);
