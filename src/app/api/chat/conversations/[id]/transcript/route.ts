import { NextRequest, NextResponse } from "next/server";
import { isAdmin, canAccessConversation } from "@/lib/chat/permissions";
import { getMessages } from "@/lib/chat/get-messages";
import { visitorIdSchema, safeParse } from "@/lib/chat/validation";

export const runtime = "nodejs";

const SENDER_LABEL: Record<string, string> = { visitor: "Candidate", admin: "Dominic", bot: "Assistant" };

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Plain-text transcript — no PDF-generation dependency exists in this
 * project yet, and adding one for a single feature is out of proportion;
 * a downloadable, human-readable .txt satisfies "download transcript"
 * without a new heavyweight dependency. Available to the admin (any
 * conversation) or the visitor who owns it, matching every other
 * conversation-scoped route's authorization model.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const visitorId = safeParse(visitorIdSchema, searchParams.get("visitorId") ?? undefined) ?? undefined;

  const admin = await isAdmin();
  const conversation = await canAccessConversation(id, { admin, visitorId });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await getMessages(id);

  const lines: string[] = [
    "Live Chat conversation transcript",
    `Conversation ID: ${conversation.id}`,
    `Candidate: ${conversation.name || "Anonymous visitor"}`,
    `Started: ${formatTimestamp(conversation.createdAt)}`,
    `Ended: ${conversation.closedAt ? formatTimestamp(conversation.closedAt) : "Still open"}`,
    "",
    "----------------------------------------",
    "",
  ];

  for (const message of messages) {
    if (message.deleted) continue;
    lines.push(`[${formatTimestamp(message.createdAt)}] ${SENDER_LABEL[message.sender] ?? message.sender}:`);
    if (message.content) lines.push(message.content);
    for (const attachment of message.attachments ?? []) {
      lines.push(`[Attachment: ${attachment.originalName}]`);
    }
    lines.push("");
  }

  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversation-${conversation.id}.txt"`,
    },
  });
}
