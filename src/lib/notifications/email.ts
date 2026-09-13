import { resendProvider } from "@/services/email/resend.provider";

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

/** Fires when a visitor starts a conversation while no admin is online, so it isn't missed. */
export async function sendNewConversationEmail(conversation: {
  id: string;
  name?: string | null;
  email?: string | null;
}): Promise<void> {
  if (!ADMIN_NOTIFICATION_EMAIL) return;

  const text = `${conversation.name ?? "A visitor"} (${conversation.email ?? "no email"}) started a conversation.\n\nOpen it in the admin dashboard: /admin/chat?conversation=${conversation.id}`;

  const result = await resendProvider.send({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: "New live chat message",
    html: `<p>${text.replace(/\n/g, "<br />")}</p>`,
    text,
  });

  if (!result.ok) {
    console.error("[email] provider request failed", {
      provider: "resend",
      template: "new-conversation-alert",
      status: "failed",
      error: result.error,
    });
    return;
  }

  console.log("[email] sent", {
    provider: "resend",
    template: "new-conversation-alert",
    status: "success",
    resendMessageId: result.id,
  });
}
