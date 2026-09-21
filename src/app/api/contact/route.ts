import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { contactFormSchema, BUDGET_CURRENCIES } from "@/lib/contact/validation";
import {
  ATTACHMENT_SIZE_ERROR,
  ATTACHMENT_TYPE_ERROR,
  validateAttachmentMeta,
  verifyAttachmentSignature,
} from "@/lib/contact/attachments";

export const runtime = "nodejs";

function adminRecipients(): string[] {
  if (process.env.ADMIN_NOTIFICATION_EMAIL) return [process.env.ADMIN_NOTIFICATION_EMAIL];

  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function budgetSymbol(currency: string | undefined): string {
  return BUDGET_CURRENCIES.find((c) => c.value === currency)?.symbol ?? "";
}

/**
 * Handles the "Have a project in mind?" enquiry form. Always multipart —
 * even when no file is attached — so the same parsing path is used whether
 * or not a project brief was uploaded.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return apiError("invalid_request", "Expected a multipart form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  const parsed = contactFormSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    company: form.get("company"),
    budgetAmount: form.get("budgetAmount"),
    budgetCurrency: form.get("budgetCurrency"),
    budgetCurrencyOther: form.get("budgetCurrencyOther"),
    projectType: form.get("projectType"),
    message: form.get("message"),
  });
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  let ipLimit, emailLimit;
  try {
    ipLimit = await checkRateLimit(`contact-form:ip:${ip}`, 8, 60 * 60);
    emailLimit = await checkRateLimit(`contact-form:email:${data.email}`, 5, 60 * 60);
  } catch (error) {
    console.error("[api/contact] rate limit check failed:", error);
    return apiError("internal_error", "Something went wrong. Please try again shortly.", 500);
  }
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return apiError("rate_limited", "Too many submissions. Please try again later.", 429);
  }

  let attachment: { name: string; size: number; type: string; buffer: Buffer } | null = null;
  const rawFile = form.get("attachment");
  if (rawFile instanceof File && rawFile.size > 0) {
    const metaError = validateAttachmentMeta(rawFile);
    if (metaError) {
      const code = metaError === ATTACHMENT_SIZE_ERROR ? "attachment_too_large" : "invalid_attachment";
      return apiError(code, metaError, 400, { attachment: metaError });
    }

    const signatureOk = await verifyAttachmentSignature(rawFile).catch(() => false);
    if (!signatureOk) {
      return apiError("invalid_attachment", ATTACHMENT_TYPE_ERROR, 400, {
        attachment: ATTACHMENT_TYPE_ERROR,
      });
    }

    attachment = {
      name: rawFile.name,
      size: rawFile.size,
      type: rawFile.type,
      buffer: Buffer.from(await rawFile.arrayBuffer()),
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const recipients = adminRecipients();

  if (!resendApiKey || !fromEmail || recipients.length === 0) {
    return apiError("not_configured", "Contact form is not configured.", 500);
  }

  const resend = new Resend(resendApiKey);

  const budgetLine = data.budgetAmount
    ? data.budgetCurrency === "OTHER"
      ? `${data.budgetAmount} ${data.budgetCurrencyOther ?? ""}`.trim()
      : `${budgetSymbol(data.budgetCurrency)}${data.budgetAmount}`
    : null;

  const detailLines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.company && `Company: ${data.company}`,
    budgetLine && `Budget: ${budgetLine}`,
    data.projectType && `Project Type: ${data.projectType}`,
    attachment && `Attachment: ${attachment.name} (${(attachment.size / 1024).toFixed(0)} KB)`,
    "",
    data.message,
  ].filter((line): line is string => Boolean(line) || line === "");

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      replyTo: data.email,
      subject: `New enquiry from ${data.name}`,
      text: detailLines.join("\n"),
      attachments: attachment
        ? [{ filename: attachment.name, content: attachment.buffer, contentType: attachment.type }]
        : undefined,
    });

    if (error) {
      console.error("[api/contact] Resend email error:", error);
      return apiError("email_send_failed", "Failed to send your message.", 502);
    }
  } catch (err) {
    console.error("[api/contact] Resend email error:", err);
    return apiError("email_send_failed", "Failed to send your message.", 500);
  }

  return NextResponse.json({
    success: true,
    attachment: attachment ? { name: attachment.name, size: attachment.size, type: attachment.type } : null,
  });
}
