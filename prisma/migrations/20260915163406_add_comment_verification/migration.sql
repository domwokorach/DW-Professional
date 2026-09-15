-- CreateTable
CREATE TABLE "CommentVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "company" TEXT,
    "body" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "pinHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentVerification_email_createdAt_idx" ON "CommentVerification"("email", "createdAt");
