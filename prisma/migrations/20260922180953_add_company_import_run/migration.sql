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
CREATE INDEX "CompanyImportRun_sourceKey_status_idx" ON "CompanyImportRun"("sourceKey", "status");

-- CreateIndex
CREATE INDEX "CompanyImportRun_sourceKey_startedAt_idx" ON "CompanyImportRun"("sourceKey", "startedAt");
