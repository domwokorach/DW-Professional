-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleCompany" TEXT,
    "comment" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comment_submissionId_key" ON "Comment"("submissionId");

-- CreateIndex
CREATE INDEX "Comment_status_createdAt_idx" ON "Comment"("status", "createdAt");
