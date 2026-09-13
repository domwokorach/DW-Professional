import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Admin Chat <security@dominicwokorach.me>";

interface SendTemplateEmailParams {
  to: string;
  subject: string;
  template: ReactElement;
}

/**
 * Renders a react-email template to both HTML and plain text and sends it
 * via Resend. Never throws on a missing API key in non-production so local
 * dev without email configured doesn't break auth flows — it logs instead.
 */
export async function sendTemplateEmail({ to, subject, template }: SendTemplateEmailParams): Promise<void> {
  const html = await render(template);
  const text = await render(template, { plainText: true });

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not configured — skipping send of "${subject}" to ${to}`);
    return;
  }

  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html, text });
  if (error) {
    console.error("[email] send failed", { to, subject, error });
  }
}
