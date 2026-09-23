import { render } from "@react-email/components";
import { resendProvider } from "@/services/email/resend.provider";
import ChatWaitingEmail from "@/services/email/templates/chat-waiting";
import { formatWaitingDuration } from "@/lib/chat/helpers";

// Mirrors src/lib/contact/config.ts's fallback chain so either env-var
// naming works in Vercel — this project already has CONTACT_TO_EMAIL set,
// not ADMIN_NOTIFICATION_EMAIL, and chat notifications previously read only
// the latter (as a module-load-time constant, so it could never see a
// value set after import either), so they silently never sent. Resolved
// per-call, not at module scope, so it's testable and always current.
function resolveAdminNotificationEmail(): string | undefined {
  const raw = process.env.CONTACT_TO_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAILS ?? "";
  return raw.split(",")[0]?.trim() || undefined;
}

function resolveAppUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.dominicwokorach.me";
}

export interface ChatWaitingConversation {
  id: string;
  name?: string | null;
  email?: string | null;
  /** Latest visitor message content — never admin-only notes. */
  messagePreview?: string;
  /** When the admin first fell behind on this conversation; used for both "received" and "waiting for" copy. */
  waitingSince?: Date | string | null;
}

function formatReceivedAt(waitingSince?: Date | string | null): string {
  const date = waitingSince ? new Date(waitingSince) : new Date();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function sendChatWaitingEmail(conversation: ChatWaitingConversation, isReminder: boolean): Promise<void> {
  const adminNotificationEmail = resolveAdminNotificationEmail();
  if (!adminNotificationEmail) {
    console.error(
      "[email] Missing required environment variable: set CONTACT_TO_EMAIL, ADMIN_NOTIFICATION_EMAIL, or ADMIN_EMAILS — chat waiting notification not sent",
    );
    return;
  }

  const candidateName = conversation.name || "A visitor";
  const waitingSince = conversation.waitingSince ? new Date(conversation.waitingSince) : new Date();
  const waitingFor = formatWaitingDuration(waitingSince).replace(/^Waiting /, "");
  const adminChatUrl = `${resolveAppUrl()}/admin/chat?conversation=${conversation.id}`;

  const props = {
    candidateName,
    candidateEmail: conversation.email,
    conversationId: conversation.id,
    messagePreview: conversation.messagePreview || "(no message preview available)",
    receivedAt: formatReceivedAt(conversation.waitingSince),
    waitingFor,
    adminChatUrl,
    isReminder,
  };

  const subject = isReminder ? `Still waiting: ${candidateName} in Live Chat` : "New candidate waiting in Live Chat";
  const template = "chat-waiting-alert";

  const [html, text] = await Promise.all([
    render(ChatWaitingEmail(props)),
    render(ChatWaitingEmail(props), { plainText: true }),
  ]);

  const result = await resendProvider.send({ to: adminNotificationEmail, subject, html, text });

  if (!result.ok) {
    console.error("[email] provider request failed", {
      provider: "resend",
      template,
      isReminder,
      status: "failed",
      error: result.error,
    });
    return;
  }

  console.log("[email] sent", {
    provider: "resend",
    template,
    isReminder,
    status: "success",
    resendMessageId: result.id,
  });
}

/**
 * The one-time alert for a conversation that now needs an admin reply.
 * Fired regardless of admin presence (a manually-Away/Busy/Offline admin
 * still needs to know) — dedup (`initialNotificationSentAt`) is the
 * caller's responsibility, see the socket server's waiting-conversation
 * sweep in src/lib/socket/server.ts.
 */
export async function sendNewConversationEmail(conversation: ChatWaitingConversation): Promise<void> {
  await sendChatWaitingEmail(conversation, false);
}

/**
 * The single follow-up reminder for a conversation that's still waiting
 * ~5 minutes after `waitingSince`. Never sent more than once per waiting
 * window — dedup (`reminderNotificationSentAt`) is the caller's
 * responsibility.
 */
export async function sendChatWaitingReminderEmail(conversation: ChatWaitingConversation): Promise<void> {
  await sendChatWaitingEmail(conversation, true);
}
