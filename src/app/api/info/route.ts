import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { del } from "@vercel/blob";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { normalizeMobileNumber } from "@/lib/contact/phone";
import {
  ATTACHMENT_BLOB_PREFIX,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_SIZE_ERROR,
  ATTACHMENT_TYPE_ERROR,
  formatFileSize,
  verifyAttachmentSignatureFromBuffer,
} from "@/lib/contact/attachments";
import { INFO_MIN_FILL_MS, INFO_PROJECT_TYPE_OPTIONS, infoFormSchema } from "@/lib/info/validation";
import InfoEnquiryEmail from "@/services/email/templates/info-enquiry";

export const runtime = "nodejs";

const DEFAULT_INFO_TO_EMAIL = "dominic.wokorach-o@outlook.com";
const UNAVAILABLE_MESSAGE = "We couldn't submit your information right now. Please try again.";
const ATTACHMENT_MISSING_MESSAGE = "Your file could not be found. Please upload it again.";

/** Server-only email settings. INFO_TO_EMAIL can override the recipient without a code change. */
function getInfoEmailConfig() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.INFO_TO_EMAIL?.trim() || DEFAULT_INFO_TO_EMAIL;
  if (!resendApiKey) return { ok: false as const, missing: "RESEND_API_KEY" };
  if (!fromEmail) return { ok: false as const, missing: "CONTACT_FROM_EMAIL" };
  return { ok: true as const, resendApiKey, fromEmail, toEmail };
}

/**
 * Handles the /info form — the page the QR code opens. Mirrors
 * /api/contact: the optional attachment was already uploaded to Blob
 * storage from the browser (via /api/contact/upload), so this route
 * re-downloads and re-verifies it before attaching it to the email.
 */
export async function POST(request: NextRequest) {
  const emailConfig = getInfoEmailConfig();
  if (!emailConfig.ok) {
    console.error(`[api/info] Info form is not configured: missing ${emailConfig.missing}`);
    return apiError("not_configured", UNAVAILABLE_MESSAGE, 500);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
    return apiError("invalid_request", "Expected a form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  // Spam protection, step 1: a honeypot field humans never see. Bots that
  // fill it get a normal-looking success so they don't learn to skip it.
  const honeypot = String(form.get("website") ?? "").trim();
  if (honeypot) {
    console.warn("[api/info] honeypot triggered, dropping submission");
    return NextResponse.json({ success: true });
  }

  // Step 2: reject forms submitted implausibly fast after the page loaded.
  const startedAt = Number(form.get("startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < INFO_MIN_FILL_MS) {
    return apiError("too_fast", "That was quick! Please check your details and submit again.", 400);
  }

  const ip = extractClientIp(request.headers) ?? "unknown";

  const parsed = infoFormSchema.safeParse({
    fullName: form.get("fullName"),
    email: form.get("email"),
    mobile: form.get("mobile"),
    mobileCountry: form.get("mobileCountry"),
    company: form.get("company"),
    projectType: form.get("projectType"),
    linkedinUrl: form.get("linkedinUrl"),
    githubUrl: form.get("githubUrl"),
    otherUrl: form.get("otherUrl"),
    message: form.get("message"),
    attachmentUrl: form.get("attachmentUrl"),
    attachmentName: form.get("attachmentName"),
    attachmentType: form.get("attachmentType"),
    attachmentSize: form.get("attachmentSize"),
    submissionId: form.get("submissionId"),
  });
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  const mobileResult = normalizeMobileNumber(data.mobile, data.mobileCountry);
  if (mobileResult.error || !mobileResult.value) {
    const error = mobileResult.error ?? "Enter your mobile number.";
    return apiError("invalid_mobile", error, 400, { mobile: error });
  }
  const mobile = mobileResult.value;

  // Step 3: per-IP and per-email rate limits.
  let ipLimit, emailLimit;
  try {
    ipLimit = await checkRateLimit(`info-form:ip:${ip}`, 6, 60 * 60);
    emailLimit = await checkRateLimit(`info-form:email:${data.email}`, 4, 60 * 60);
  } catch (error) {
    console.error("[api/info] rate limit check failed:", error);
    return apiError("internal_error", UNAVAILABLE_MESSAGE, 500);
  }
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return apiError("rate_limited", "Too many submissions. Please try again later.", 429);
  }

  let attachment: { name: string; size: number; type: string; buffer: Buffer } | null = null;
  if (data.attachmentUrl) {
    let blobUrl: URL | null = null;
    try {
      blobUrl = new URL(data.attachmentUrl);
    } catch {
      blobUrl = null;
    }
    // Only fetch our own temp uploads — never an arbitrary visitor-supplied URL.
    if (
      !blobUrl ||
      blobUrl.protocol !== "https:" ||
      !blobUrl.hostname.endsWith(".blob.vercel-storage.com") ||
      !blobUrl.pathname.startsWith(`/${ATTACHMENT_BLOB_PREFIX}`)
    ) {
      return apiError("invalid_attachment", "Invalid attachment reference.", 400, {
        attachment: "Invalid attachment reference.",
      });
    }

    let fetchRes: Response;
    try {
      fetchRes = await fetch(blobUrl);
    } catch (error) {
      console.error("[api/info] attachment fetch failed:", error);
      return apiError("attachment_unavailable", ATTACHMENT_MISSING_MESSAGE, 400, { attachment: ATTACHMENT_MISSING_MESSAGE });
    }
    if (!fetchRes.ok) {
      return apiError("attachment_unavailable", ATTACHMENT_MISSING_MESSAGE, 400, { attachment: ATTACHMENT_MISSING_MESSAGE });
    }

    const buffer = Buffer.from(await fetchRes.arrayBuffer());
    if (buffer.byteLength > ATTACHMENT_MAX_BYTES) {
      return apiError("attachment_too_large", ATTACHMENT_SIZE_ERROR, 400, { attachment: ATTACHMENT_SIZE_ERROR });
    }
    if (!verifyAttachmentSignatureFromBuffer(buffer, data.attachmentName ?? "")) {
      return apiError("invalid_attachment", ATTACHMENT_TYPE_ERROR, 400, { attachment: ATTACHMENT_TYPE_ERROR });
    }

    attachment = {
      name: data.attachmentName ?? "attachment",
      size: buffer.byteLength,
      type: data.attachmentType ?? "",
      buffer,
    };
  }

  const submittedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date());

  const emailProps = {
    fullName: data.fullName,
    email: data.email,
    mobile,
    company: data.company,
    projectType: INFO_PROJECT_TYPE_OPTIONS.find((o) => o.value === data.projectType)?.label ?? null,
    linkedinUrl: data.linkedinUrl ?? null,
    githubUrl: data.githubUrl ?? null,
    otherUrl: data.otherUrl ?? null,
    message: data.message ?? null,
    submittedAt,
    attachment: attachment
      ? { filename: attachment.name, type: attachment.type || "Unknown type", size: formatFileSize(attachment.size) }
      : null,
  };

  const [html, text] = await Promise.all([
    render(InfoEnquiryEmail(emailProps)),
    render(InfoEnquiryEmail(emailProps), { plainText: true }),
  ]);

  const resend = new Resend(emailConfig.resendApiKey);
  try {
    const { error } = await resend.emails.send(
      {
        from: emailConfig.fromEmail,
        to: [emailConfig.toEmail],
        replyTo: data.email,
        subject: `New information from ${data.fullName} (${data.company})`,
        html,
        text,
        attachments: attachment
          ? [{ filename: attachment.name, content: attachment.buffer, contentType: attachment.type }]
          : undefined,
      },
      // A retry of the same submission (e.g. the response was lost) reuses
      // this key, so Resend won't deliver the email twice.
      { idempotencyKey: `info-form/${data.submissionId}` }
    );

    if (error) {
      console.error("[api/info] Resend email error:", error);
      return apiError("email_send_failed", UNAVAILABLE_MESSAGE, 502);
    }
  } catch (err) {
    console.error("[api/info] Resend email error:", err);
    return apiError("email_send_failed", UNAVAILABLE_MESSAGE, 500);
  }

  // The file now lives in the sent email, so the temp blob can go.
  if (data.attachmentUrl) {
    del(data.attachmentUrl).catch((error) => {
      console.error("[api/info] temp attachment cleanup failed:", error);
    });
  }

  return NextResponse.json({ success: true });
}
