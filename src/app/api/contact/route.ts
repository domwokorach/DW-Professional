import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { contactFormSchema, BUDGET_CURRENCIES } from "@/lib/contact/validation";
import { getContactEmailConfig, logContactEmailConfigOnStartup } from "@/lib/contact/config";
import { normalizeMobileNumber } from "@/lib/contact/phone";
import ContactEnquiryEmail from "@/services/email/templates/contact-enquiry";
import {
  ATTACHMENT_SIZE_ERROR,
  ATTACHMENT_TYPE_ERROR,
  validateAttachmentMeta,
  verifyAttachmentSignature,
} from "@/lib/contact/attachments";

export const runtime = "nodejs";

const CONTACT_FORM_UNAVAILABLE_MESSAGE = "We couldn't send your message right now. Please try again later.";

// Runs once per cold start so a missing var shows up in server logs before any visitor hits the route.
logContactEmailConfigOnStartup();

function budgetSymbol(currency: string | undefined): string {
  return BUDGET_CURRENCIES.find((c) => c.value === currency)?.symbol ?? "";
}

/**
 * Handles the "Have a project in mind?" enquiry form. Always multipart —
 * even when no file is attached — so the same parsing path is used whether
 * or not a project brief was uploaded.
 */
export async function POST(request: NextRequest) {
  const emailConfig = getContactEmailConfig();
  if (!emailConfig.ok) {
    console.error(`[api/contact] Contact form is not configured: missing ${emailConfig.missing}`);
    return apiError("not_configured", CONTACT_FORM_UNAVAILABLE_MESSAGE, 500);
  }
  const { resendApiKey, fromEmail, toEmails } = emailConfig.config;

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
    mobile: form.get("mobile"),
    mobileCountry: form.get("mobileCountry"),
    company: form.get("company"),
    companyNumber: form.get("companyNumber"),
    budgetAmount: form.get("budgetAmount"),
    budgetCurrency: form.get("budgetCurrency"),
    budgetCurrencyOther: form.get("budgetCurrencyOther"),
    projectType: form.get("projectType"),
    message: form.get("message"),
  });
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  const mobileResult = normalizeMobileNumber(data.mobile, data.mobileCountry);
  if (mobileResult.error) {
    return apiError("invalid_mobile", mobileResult.error, 400, { mobile: mobileResult.error });
  }
  const mobile = mobileResult.value;

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

  const resend = new Resend(resendApiKey);

  const budgetLine = data.budgetAmount
    ? data.budgetCurrency === "OTHER"
      ? `${data.budgetAmount} ${data.budgetCurrencyOther ?? ""}`.trim()
      : `${budgetSymbol(data.budgetCurrency)}${data.budgetAmount}`
    : null;

  const companyLine = data.company
    ? data.companyNumber
      ? `${data.company} (Company No. ${data.companyNumber})`
      : data.company
    : null;

  const submittedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date());

  const emailProps = {
    name: data.name,
    email: data.email,
    mobile,
    company: companyLine,
    budgetLine,
    projectType: data.projectType ?? null,
    message: data.message,
    submittedAt,
    attachment: attachment ? { filename: attachment.name, type: attachment.type || "Unknown type" } : null,
  };

  const [html, text] = await Promise.all([
    render(ContactEnquiryEmail(emailProps)),
    render(ContactEnquiryEmail(emailProps), { plainText: true }),
  ]);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      replyTo: data.email,
      subject: `New portfolio enquiry from ${data.name}`,
      html,
      text,
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
