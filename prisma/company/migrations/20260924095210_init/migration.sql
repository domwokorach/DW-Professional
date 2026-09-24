-- CreateTable
CREATE TABLE "CompanyRecord" (
    "id" TEXT NOT NULL,
    "companyNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "status" TEXT,
    "category" TEXT,
    "incorporationDate" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "locality" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "postcodeNormalized" TEXT,
    "country" TEXT,
    "uri" TEXT,
    "sicCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importGeneration" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyImportRun" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "generation" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "headerFields" JSONB,
    "byteOffset" BIGINT NOT NULL DEFAULT 0,
    "totalBytes" BIGINT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedRows" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRecord_companyNumber_key" ON "CompanyRecord"("companyNumber");

-- CreateIndex
CREATE INDEX "CompanyRecord_name_idx" ON "CompanyRecord"("name");

-- CreateIndex
CREATE INDEX "CompanyRecord_nameNormalized_idx" ON "CompanyRecord"("nameNormalized");

-- CreateIndex
CREATE INDEX "CompanyRecord_postcodeNormalized_idx" ON "CompanyRecord"("postcodeNormalized");

-- CreateIndex
CREATE INDEX "CompanyRecord_status_idx" ON "CompanyRecord"("status");

-- CreateIndex
CREATE INDEX "CompanyRecord_importGeneration_idx" ON "CompanyRecord"("importGeneration");

-- CreateIndex
CREATE INDEX "CompanyImportRun_sourceKey_status_idx" ON "CompanyImportRun"("sourceKey", "status");

-- CreateIndex
CREATE INDEX "CompanyImportRun_sourceKey_startedAt_idx" ON "CompanyImportRun"("sourceKey", "startedAt");
