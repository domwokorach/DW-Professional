import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { isAdmin, canAccessConversation } from "@/lib/chat/permissions";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import {
  CHAT_ATTACHMENT_BLOB_PREFIX,
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MIME_TYPES,
} from "@/lib/chat/attachments";

export const runtime = "nodejs";

interface ClientPayload {
  conversationId: string;
  visitorId?: string;
}

function parseClientPayload(raw: string | null): ClientPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ClientPayload>;
    if (typeof parsed.conversationId !== "string") return null;
    return { conversationId: parsed.conversationId, visitorId: parsed.visitorId };
  } catch {
    return null;
  }
}

/**
 * Token endpoint for the chat composer's client-side attachment upload
 * (both Live Chat and Admin Chat use `upload()` from `@vercel/blob/client`)
 * — mirrors src/app/api/contact/upload/route.ts, but additionally checks
 * that the requester (admin, or the visitor who owns it) may actually post
 * to the target conversation before a token is ever issued.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Couldn't read the upload request." }, { status: 400 });

  const admin = await isAdmin();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        if (!pathname.startsWith(CHAT_ATTACHMENT_BLOB_PREFIX)) {
          throw new Error("Invalid upload path.");
        }

        const payload = parseClientPayload(clientPayloadRaw);
        if (!payload) throw new Error("Missing conversation context.");
        if (!/^[a-zA-Z0-9-]+$/.test(payload.conversationId) ||
            !new RegExp(`^${CHAT_ATTACHMENT_BLOB_PREFIX}${payload.conversationId}/[a-f0-9-]{36}\\.(pdf|doc|docx|png|jpg|jpeg|txt)$`).test(pathname)) {
          throw new Error("Invalid conversation upload path.");
        }

        const conversation = await canAccessConversation(payload.conversationId, {
          admin,
          visitorId: payload.visitorId,
        });
        if (!conversation) throw new Error("You don't have access to this conversation.");
        if (conversation.status === "closed") throw new Error("This conversation has been closed.");

        const limit = await checkRateLimit(`chat-upload:ip:${ip}`, 30, 60 * 60);
        if (!limit.allowed) throw new Error("Too many uploads. Please try again later.");

        return {
          allowedContentTypes: CHAT_ATTACHMENT_MIME_TYPES,
          maximumSizeInBytes: CHAT_ATTACHMENT_MAX_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log(`[api/chat/attachments] upload completed: ${blob.pathname}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[api/chat/attachments] token generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't start the upload." },
      { status: 400 }
    );
  }
}

/** Chat attachments are retained as history; arbitrary client deletion is forbidden. */
export async function DELETE() {
  return NextResponse.json({ error: "Chat attachments cannot be deleted directly." }, { status: 405 });
}
