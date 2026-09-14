import type { Conversation as PrismaConversation } from "@prisma/client";
import { db } from "@/lib/database/db";
import { toConversation } from "@/lib/database/queries";
import type { Conversation } from "@/types/conversation";

const UNIQUE_CONSTRAINT_ERROR_CODE = "P2002";

type ConversationDetails = { name?: string; email?: string; mobile?: string; companyName?: string };

function findActive(visitorId: string) {
  return db.conversation.findFirst({
    where: { visitorId, status: { in: ["OPEN", "PENDING"] } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fills in details a conversation was created without. The socket auth token
 * fetch and the conversation-bootstrap POST both call findOrCreateConversation
 * for the same visitor as soon as a candidate registers — the token route
 * never has name/email/mobile/companyName to give it, so if that request
 * wins the race and creates the row first, the bootstrap call's details must
 * still land on it rather than being silently discarded by the "already
 * exists" branch. Never overwrites a value that's already set.
 */
function applyMissingDetails(conversation: PrismaConversation, details?: ConversationDetails) {
  if (!details) return Promise.resolve(conversation);

  const patch: ConversationDetails = {};
  if (details.name && !conversation.name) patch.name = details.name;
  if (details.email && !conversation.email) patch.email = details.email;
  if (details.mobile && !conversation.mobile) patch.mobile = details.mobile;
  if (details.companyName && !conversation.companyName) patch.companyName = details.companyName;

  if (Object.keys(patch).length === 0) return Promise.resolve(conversation);
  return db.conversation.update({ where: { id: conversation.id }, data: patch });
}

/**
 * Reuses a visitor's existing open conversation instead of forking a new
 * thread per page load. Race-safe: a partial unique index on
 * (visitorId) WHERE status IN (OPEN, PENDING) guarantees at most one active
 * conversation per visitor, so a concurrent insert from another request for
 * the same visitor fails here with a unique violation instead of creating a
 * second row — which previously left the visitor's socket auth token (from
 * /api/chat/token) and the chat UI (from /api/chat/conversations) pointing
 * at two different conversation ids, causing every message and join from
 * that visitor to be silently dropped by the server's conversationId check.
 */
export async function findOrCreateConversation(
  visitorId: string,
  details?: ConversationDetails
): Promise<Conversation> {
  const existing = await findActive(visitorId);
  if (existing) return toConversation(await applyMissingDetails(existing, details));

  try {
    const created = await db.conversation.create({
      data: {
        visitorId,
        name: details?.name,
        email: details?.email,
        mobile: details?.mobile,
        companyName: details?.companyName,
        status: "OPEN",
      },
    });

    return toConversation(created);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === UNIQUE_CONSTRAINT_ERROR_CODE
    ) {
      const winner = await findActive(visitorId);
      if (winner) return toConversation(await applyMissingDetails(winner, details));
    }
    throw error;
  }
}
