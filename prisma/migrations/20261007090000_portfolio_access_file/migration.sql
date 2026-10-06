-- CreateTable: files (uploads or camera photos) attached to a Portfolio Access session.
CREATE TABLE "PortfolioAccessFile" (
    "id" TEXT NOT NULL,
    "accessId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioAccessFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioAccessFile_accessId_createdAt_idx" ON "PortfolioAccessFile"("accessId", "createdAt");

-- AddForeignKey
ALTER TABLE "PortfolioAccessFile" ADD CONSTRAINT "PortfolioAccessFile_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "PortfolioAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
