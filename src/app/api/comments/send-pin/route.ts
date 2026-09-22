import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/database/db";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { generatePin, hashToken } from "@/lib/auth/tokens";
import { COMMENT_PIN_TTL_MS } from "@/lib/auth/env";
import { sendCommentPinEmail } from "@/services/email/email.service";
import {
  sendCommentPinSchema,
  ALLOWED_AVATAR_TYPES,
  AVATAR_MAX_BYTES,
} from "@/lib/comments/validation";

export const runtime = "nodejs";

/**
 * Step 1 of comment submission: validate the fields + contact details,
 * upload the optional avatar, and email a 6-digit PIN. Nothing is written
 * to the public Comment table yet — that only happens once the PIN is
 * confirmed in /api/comments/verify-pin.
 *
 * Every dependency below (Redis/rate-limit, Blob, Postgres, email) can throw
 * on a misconfigured or degraded environment. Route Handlers turn an
 * uncaught throw into a non-JSON 500 response, which breaks `res.json()` on
 * the client — so every fallible step here is caught individually and
 * turned into a proper JSON error response.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return apiError("invalid_request", "Expected a multipart form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  const parsed = sendCommentPinSchema.safeParse({
    fullName: form.get("fullName"),
    // CommentForm assembles its own FormData (see
    // src/components/comments/CommentForm.tsx) and always sends the
    // typed/selected company name under "companyName", matching the
    // contact form's shared CompanySearchField contract.
    company: form.get("companyName"),
    body: form.get("body"),
    email: form.get("email"),
    companyId: form.get("companyId"),
    companyNumber: form.get("companyNumber"),
    companyStatus: form.get("companyStatus"),
    companySource: form.get("companySource"),
    companyDomain: form.get("companyDomain"),
    companyLogo: form.get("companyLogo"),
    companyIndustry: form.get("companyIndustry"),
    companyLocation: form.get("companyLocation"),
    companyPostcode: form.get("companyPostcode"),
  });
  if (!parsed.success) return validationError(parsed.error);

  let ipLimit, contactLimit;
  try {
    ipLimit = await checkRateLimit(`comment-pin-send:ip:${ip}`, 5, 60 * 60);
    contactLimit = await checkRateLimit(`comment-pin-send:email:${parsed.data.email}`, 3, 60 * 60);
  } catch (error) {
    console.error("[api/comments/send-pin] rate limit check failed:", error);
    return apiError("internal_error", "Something went wrong. Please try again shortly.", 500);
  }
  if (!ipLimit.allowed || !contactLimit.allowed) {
    return apiError("rate_limited", "Too many submissions. Please try again later.", 429);
  }

  let avatarUrl: string | null = null;
  const avatar = form.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.includes(avatar.type)) {
      return apiError("invalid_avatar", "Avatar must be a JPEG, PNG, WebP, or GIF image.", 400, {
        avatar: "Unsupported image type.",
      });
    }
    if (avatar.size > AVATAR_MAX_BYTES) {
      return apiError("invalid_avatar", "Avatar must be smaller than 5 MB.", 400, {
        avatar: "File is too large.",
      });
    }

    try {
      const extension = avatar.type.split("/")[1] ?? "jpg";
      const blob = await put(`comment-avatars/${crypto.randomUUID()}.${extension}`, avatar, {
        access: "public",
        contentType: avatar.type,
      });
      avatarUrl = blob.url;
    } catch (error) {
      console.error("[api/comments/send-pin] avatar upload failed:", error);
      return apiError(
        "avatar_upload_failed",
        "We couldn't upload your photo. Please try again without it, or with a different image.",
        502
      );
    }
  }

  const pin = generatePin();
  let verification;
  try {
    verification = await db.commentVerification.create({
      data: {
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        company: parsed.data.company ?? null,
        companyId: parsed.data.companyId ?? null,
        companyNumber: parsed.data.companyNumber ?? null,
        companyStatus: parsed.data.companyStatus ?? null,
        companySource: parsed.data.companySource ?? null,
        companyDomain: parsed.data.companyDomain ?? null,
        companyLogo: parsed.data.companyLogo ?? null,
        companyIndustry: parsed.data.companyIndustry ?? null,
        companyLocation: parsed.data.companyLocation ?? null,
        companyPostcode: parsed.data.companyPostcode ?? null,
        body: parsed.data.body,
        avatarUrl,
        pinHash: hashToken(pin),
        expiresAt: new Date(Date.now() + COMMENT_PIN_TTL_MS),
      },
    });
  } catch (error) {
    console.error("[api/comments/send-pin] failed to save verification request:", error);
    return apiError("internal_error", "We couldn't process your comment. Please try again shortly.", 500);
  }

  try {
    await sendCommentPinEmail({
      to: parsed.data.email,
      pin,
      expiresInMinutes: Math.round(COMMENT_PIN_TTL_MS / 60000),
      fullName: parsed.data.fullName,
    });
  } catch (error) {
    console.error("[api/comments/send-pin] failed to send PIN email:", error);
    return apiError(
      "email_send_failed",
      "We couldn't send a verification email. Please check the address and try again.",
      502
    );
  }

  return NextResponse.json(
    {
      ok: true,
      requestId: verification.id,
      message: "We've emailed you a verification code.",
    },
    { status: 201 }
  );
}
