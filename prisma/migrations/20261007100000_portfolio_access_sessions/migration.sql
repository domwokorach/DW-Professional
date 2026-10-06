-- Portfolio Access becomes one session per email: repeat submissions update the session.
-- Existing rows are kept as they are (one session each), keyed by their lower-cased email.
ALTER TABLE "PortfolioAccess" ADD COLUMN "emailKey" TEXT,
ADD COLUMN "lastSubmissionId" TEXT,
ADD COLUMN "submissionCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "PortfolioAccess" SET "emailKey" = lower("email"), "lastSubmittedAt" = "createdAt";

ALTER TABLE "PortfolioAccess" ALTER COLUMN "emailKey" SET NOT NULL;

-- CreateIndex
CREATE INDEX "PortfolioAccess_lastSubmittedAt_idx" ON "PortfolioAccess"("lastSubmittedAt");

-- CreateIndex
CREATE INDEX "PortfolioAccess_emailKey_idx" ON "PortfolioAccess"("emailKey");
