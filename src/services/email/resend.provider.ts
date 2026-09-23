import { Resend } from "resend";
import type { EmailProvider, SendEmailOptions, SendEmailResult } from "./types";

if (typeof window !== "undefined") {
  throw new Error("resend.provider must only be imported on the server");
}

function getFromHeader(): string {
  const name = process.env.EMAIL_FROM_NAME || "Dominic Wokorach";
  const address = process.env.EMAIL_FROM_ADDRESS || "no-reply@dominicwokorach.me";
  return `${name} <${address}>`;
}

/** Resend-backed EmailProvider. The client is created lazily so a missing API key never crashes module load — only an actual send attempt. */
export class ResendEmailProvider implements EmailProvider {
  private client: Resend | null = null;

  private getClient(): Resend | null {
    if (this.client) return this.client;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    this.client = new Resend(apiKey);
    return this.client;
  }

  async send({ to, subject, html, text, idempotencyKey }: SendEmailOptions): Promise<SendEmailResult> {
    const client = this.getClient();
    if (!client) {
      console.warn(`[email] RESEND_API_KEY not configured — skipping send of "${subject}" to recipient`);
      return { ok: false, error: "not_configured" };
    }

    const { data, error } = await client.emails.send({
      from: getFromHeader(),
      to,
      subject,
      html,
      text,
    }, idempotencyKey ? { idempotencyKey } : undefined);

    if (error) {
      console.error("[email] provider request failed", {
        template: subject,
        recipientDomain: to.split("@")[1] ?? "unknown",
        name: error.name,
      });
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  }
}

export const resendProvider = new ResendEmailProvider();
