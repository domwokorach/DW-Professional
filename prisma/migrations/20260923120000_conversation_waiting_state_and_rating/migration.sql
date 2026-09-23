-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "awaitingAdminReply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "waitingSince" TIMESTAMP(3),
ADD COLUMN     "lastCandidateMessageAt" TIMESTAMP(3),
ADD COLUMN     "lastAdminMessageAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "initialNotificationSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderNotificationSentAt" TIMESTAMP(3),
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "ratedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Conversation_awaitingAdminReply_waitingSince_idx" ON "Conversation"("awaitingAdminReply", "waitingSince");
