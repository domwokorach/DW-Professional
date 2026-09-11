import { prisma } from "@/lib/db";
import type { MessageSender } from "@prisma/client";

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LiveChatValidationError extends Error {}

export function sanitiseMessage(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) throw new LiveChatValidationError("Message is required.");
  if (value.length > MAX_MESSAGE_LENGTH) {
    throw new LiveChatValidationError("Message is too long.");
  }
  return value;
}

export function sanitiseName(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) throw new LiveChatValidationError("Name is required.");
  if (value.length > MAX_NAME_LENGTH) {
    throw new LiveChatValidationError("Name is too long.");
  }
  return value;
}

export function sanitiseEmail(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(value)) {
    throw new LiveChatValidationError("A valid email is required.");
  }
  return value;
}

export async function startConversation(params: {
  visitorId: string;
  name: string;
  email: string;
  message: string;
}) {
  const name = sanitiseName(params.name);
  const email = sanitiseEmail(params.email);
  const message = sanitiseMessage(params.message);

  const conversation = await prisma.conversation.create({
    data: {
      visitorId: params.visitorId,
      name,
      email,
      adminUnread: 1,
      messages: {
        create: {
          sender: "candidate",
          content: message,
        },
      },
    },
    include: { messages: true },
  });

  return conversation;
}

export async function getConversationForVisitor(conversationId: string, visitorId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, visitorId },
  });
}

export async function getConversationWithMessages(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function listConversations(params: { status?: "open" | "closed"; search?: string } = {}) {
  return prisma.conversation.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function addMessage(params: {
  conversationId: string;
  sender: MessageSender;
  content: string;
}) {
  const content = sanitiseMessage(params.content);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: params.conversationId,
        sender: params.sender,
        content,
      },
    }),
    prisma.conversation.update({
      where: { id: params.conversationId },
      data: {
        lastMessageAt: new Date(),
        status: "open",
        ...(params.sender === "candidate"
          ? { adminUnread: { increment: 1 } }
          : { visitorUnread: { increment: 1 } }),
      },
    }),
  ]);

  return message;
}

export async function markConversationRead(conversationId: string, reader: MessageSender) {
  const otherSender: MessageSender = reader === "admin" ? "candidate" : "admin";

  await prisma.$transaction([
    prisma.message.updateMany({
      where: { conversationId, sender: otherSender, status: { not: "read" } },
      data: { status: "read", readAt: new Date() },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: reader === "admin" ? { adminUnread: 0 } : { visitorUnread: 0 },
    }),
  ]);
}

export async function markMessagesDelivered(conversationId: string, sender: MessageSender) {
  await prisma.message.updateMany({
    where: { conversationId, sender, status: "sent" },
    data: { status: "delivered" },
  });
}

export async function setConversationStatus(conversationId: string, status: "open" | "closed") {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });
}

export async function touchVisitorLastSeen(conversationId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { visitorLastSeenAt: new Date() },
  }).catch(() => {
    // Conversation may no longer exist; presence tracking is best-effort.
  });
}

export async function getAdminStatus(): Promise<string> {
  const row = await prisma.adminStatus.findUnique({ where: { id: "singleton" } });
  return row?.status ?? "offline";
}

export async function setAdminStatus(status: "online" | "away" | "offline") {
  await prisma.adminStatus.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", status },
    update: { status },
  });
}
