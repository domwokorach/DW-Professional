import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { del } from "@vercel/blob";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { contactFormSchema, BUDGET_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/contact/validation";
import { getContactEmailConfig, logContactEmailConfigOnStartup } from "@/lib/contact/config";
import { normalizeMobileNumber } from "@/lib/contact/phone";
import ContactEnquiryEmail from "@/services/email/templates/contact-enquiry";
import {
  ATTACHMENT_BLOB_PREFIX,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_TYPE_ERROR,
  formatFileSize,
  verifyAttachmentSignatureFromBuffer,
} from "@/lib/contact/attachments";

export const runtime = "nodejs";

const CONTACT_FORM_UNAVAILABLE_MESSAGE = "We couldn't send your message right now. Please try again later.";

// Runs once per cold start so a missing var shows up in server logs before any visitor hits the route.
logContactEmailConfigOnStartup();

function budgetLabel(value: string | undefined): string | null {
  return BUDGET_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

function projectTypeLabel(value: string | undefined): string | null {
  return PROJECT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

/**
 * Handles the "Have a project in mind?" enquiry form. The attachment (if
 * any) has already been uploaded straight to Blob storage from the browser
 * (see /api/contact/upload) before this route ever runs — the form only
 * sends a reference to it, which this route re-downloads and re-verifies
 * server-side before trusting it enough to email.
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
  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
    return apiError("invalid_request", "Expected a form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  const parsed = contactFormSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    mobile: form.get("mobile"),
    mobileCountry: form.get("mobileCountry"),
    // The shared CompanySearchField (see
    // src/components/companies/CompanySearchField.tsx) always submits the
    // company name under "companyName" plus separate companyNumber /
    // companyPostcode fields, never one combined display string.
    company: form.get("companyName"),
    companyNumber: form.get("companyNumber"),
    companyPostcode: form.get("companyPostcode"),
    budget: form.get("budget"),
    projectType: form.get("projectType"),
    message: form.get("message"),
    attachmentUrl: form.get("attachmentUrl"),
    attachmentName: form.get("attachmentName"),
    attachmentType: form.get("attachmentType"),
    attachmentSize: form.get("attachmentSize"),
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
  if (data.attachmentUrl) {
    if (!data.attachmentUrl.includes(ATTACHMENT_BLOB_PREFIX)) {
      return apiError("invalid_attachment", "Invalid attachment reference.", 400, {
        attachment: "Invalid attachment reference.",
      });
    }

    let fetchRes: Response;
    try {
      fetchRes = await fetch(data.attachmentUrl);
    } catch (error) {
      console.error("[api/contact] attachment fetch failed:", error);
      return apiError("attachment_unavailable", "Your attachment could not be found. Please re-upload it.", 400, {
        attachment: "Your attachment could not be found. Please re-upload it.",
      });
    }
    if (!fetchRes.ok) {
      return apiError("attachment_unavailable", "Your attachment could not be found. Please re-upload it.", 400, {
        attachment: "Your attachment could not be found. Please re-upload it.",
      });
    }

    const buffer = Buffer.from(await fetchRes.arrayBuffer());
    if (buffer.byteLength > ATTACHMENT_MAX_BYTES) {
      return apiError("attachment_too_large", "Maximum file size is 5 MB.", 400, {
        attachment: "Maximum file size is 5 MB.",
      });
    }

    const signatureOk = verifyAttachmentSignatureFromBuffer(buffer, data.attachmentName ?? "");
    if (!signatureOk) {
      return apiError("invalid_attachment", ATTACHMENT_TYPE_ERROR, 400, { attachment: ATTACHMENT_TYPE_ERROR });
    }

    attachment = {
      name: data.attachmentName ?? "attachment",
      size: buffer.byteLength,
      type: data.attachmentType ?? "",
      buffer,
    };
  }

  const resend = new Resend(resendApiKey);

  const companyDetails = [
    data.companyNumber ? `Company No. ${data.companyNumber}` : null,
    data.companyPostcode ? `Postcode: ${data.companyPostcode}` : null,
  ].filter((part): part is string => Boolean(part));
  const companyLine = data.company
    ? companyDetails.length > 0
      ? `${data.company} (${companyDetails.join(", ")})`
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
    budgetLine: budgetLabel(data.budget),
    projectType: projectTypeLabel(data.projectType),
    message: data.message,
    submittedAt,
    attachment: attachment
      ? { filename: attachment.name, type: attachment.type || "Unknown type", size: formatFileSize(attachment.size) }
      : null,
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

  // The attachment now lives in the sent email — the temp blob copy has
  // served its purpose regardless of outcome, so it's cleaned up either way.
  if (data.attachmentUrl) {
    del(data.attachmentUrl).catch((error) => {
      console.error("[api/contact] temp attachment cleanup failed:", error);
    });
  }

  return NextResponse.json({
    success: true,
    attachment: attachment ? { name: attachment.name, size: attachment.size, type: attachment.type } : null,
  });
}
