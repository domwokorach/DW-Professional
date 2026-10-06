-- CreateTable: Portfolio Access submissions (the form shown before the CV opens).
CREATE TABLE "PortfolioAccess" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "company" TEXT,
    "companyNumber" TEXT,
    "device" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "source" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "notificationStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioAccess_submissionId_key" ON "PortfolioAccess"("submissionId");

-- CreateIndex
CREATE INDEX "PortfolioAccess_createdAt_idx" ON "PortfolioAccess"("createdAt");

-- CreateIndex
CREATE INDEX "PortfolioAccess_email_createdAt_idx" ON "PortfolioAccess"("email", "createdAt");

-- CreateIndex
CREATE INDEX "PortfolioAccess_ipAddress_createdAt_idx" ON "PortfolioAccess"("ipAddress", "createdAt");
