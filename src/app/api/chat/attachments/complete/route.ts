import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { isAdmin, canAccessConversation } from "@/lib/chat/permissions";
import { sendMessage } from "@/lib/chat/send-message";
import { sanitizeMessage } from "@/lib/utils/sanitize-message";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { publish } from "@/lib/redis/pubsub";
import { CHAT_MESSAGE_CREATED_CHANNEL } from "@/lib/chat/message-created-channel";
import {
  CHAT_ATTACHMENT_BLOB_PREFIX,
  CHAT_ATTACHMENT_MAX_BYTES,
  verifyChatAttachmentSignatureFromBuffer,
} from "@/lib/chat/attachments";

export const runtime = "nodejs";

interface CompleteAttachmentBody {
  conversationId: string;
  visitorId?: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  content?: string;
  clientMessageId?: string;
}

/**
 * Finishes a chat attachment upload: re-downloads the bytes the client
 * already put in Blob storage and re-verifies them server-side (extension,
 * declared size, and magic-number signature — never trust the client's own
 * validateChatAttachmentMeta alone), then creates the Attachment + Message
 * together and broadcasts it. Sending happens here rather than over the
 * socket because the signature check needs the actual bytes, which the
 * realtime path never sees.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const limit = await checkRateLimit(`chat-attachment-complete:ip:${ip}`, 20, 60 * 60);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Partial<CompleteAttachmentBody> | null;
  if (
    !body?.conversationId ||
    !body.url ||
    !body.originalName ||
    !body.mimeType ||
    typeof body.size !== "number"
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!body.url.includes(CHAT_ATTACHMENT_BLOB_PREFIX)) {
    return NextResponse.json({ error: "Invalid attachment URL." }, { status: 400 });
  }
  if (body.size > CHAT_ATTACHMENT_MAX_BYTES) {
    await del(body.url).catch(() => {});
    return NextResponse.json({ error: "This file is larger than the 5 MB limit." }, { status: 400 });
  }

  const admin = await isAdmin();
  const conversation = await canAccessConversation(body.conversationId, { admin, visitorId: body.visitorId });
  if (!conversation) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (conversation.status === "closed") {
    return NextResponse.json({ error: "This conversation has been closed." }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    const res = await fetch(body.url);
    if (!res.ok) throw new Error(`fetch failed with status ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } catch (error) {
    console.error("[api/chat/attachments/complete] failed to fetch uploaded blob:", error);
    return NextResponse.json({ error: "Couldn't verify the uploaded file." }, { status: 400 });
  }

  if (buffer.byteLength > CHAT_ATTACHMENT_MAX_BYTES || !verifyChatAttachmentSignatureFromBuffer(buffer, body.originalName)) {
    await del(body.url).catch(() => {});
    return NextResponse.json({ error: "This file's contents don't match a supported file type." }, { status: 400 });
  }

  const rawContent = body.content ?? "";
  const content = rawContent ? (sanitizeMessage(rawContent) ?? "") : "";

  const message = await sendMessage({
    conversationId: body.conversationId,
    sender: admin ? "admin" : "visitor",
    senderId: admin ? admin.userId : body.visitorId,
    content,
    clientMessageId: body.clientMessageId,
    attachments: [
      { originalName: body.originalName, storageKey: body.url, mimeType: body.mimeType, size: body.size },
    ],
  });

  await publish(CHAT_MESSAGE_CREATED_CHANNEL, { conversationId: body.conversationId, messageId: message.id });

  return NextResponse.json({ message });
}
