-- CreateTable
CREATE TABLE "CompanyRecord" (
    "id" TEXT NOT NULL,
    "companyNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT,
    "category" TEXT,
    "incorporationDate" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "locality" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "sicCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRecord_companyNumber_key" ON "CompanyRecord"("companyNumber");

-- CreateIndex
CREATE INDEX "CompanyRecord_name_idx" ON "CompanyRecord"("name");

-- CreateIndex
CREATE INDEX "CompanyRecord_status_idx" ON "CompanyRecord"("status");

-- Trigram support for fast case-insensitive substring search on company
-- name (mirrors Companies House's company_name_includes behaviour).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "CompanyRecord_name_trgm_idx" ON "CompanyRecord" USING GIN ("name" gin_trgm_ops);
