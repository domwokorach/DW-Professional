import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

/** Fires when a visitor starts a conversation while no admin is online, so it isn't missed. */
export async function sendNewConversationEmail(conversation: {
  id: string;
  name?: string | null;
  email?: string | null;
}): Promise<void> {
  if (!resend || !ADMIN_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: "Live Chat <live-chat@dominicwokorach.me>",
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: "New live chat message",
    text: `${conversation.name ?? "A visitor"} (${conversation.email ?? "no email"}) started a conversation.\n\nOpen it in the admin dashboard: /admin/live-chat?conversation=${conversation.id}`,
  });
}
