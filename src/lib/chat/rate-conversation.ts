import { db } from "@/lib/database/db";

/**
 * Records the post-chat rating exactly once per conversation — the `WHERE
 * ratedAt IS NULL` guard is what actually prevents a repeated/accidental
 * resubmission (a disabled button on the client is not enough on its own).
 */
export async function rateConversation(
  conversationId: string,
  rating: number,
  feedback?: string
): Promise<boolean> {
  const { count } = await db.conversation.updateMany({
    where: { id: conversationId, ratedAt: null },
    data: { rating, feedback: feedback || null, ratedAt: new Date() },
  });
  return count > 0;
}
