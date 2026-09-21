import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { generatePin, hashToken } from "@/lib/auth/tokens";
import { COMMENT_PIN_TTL_MS, COMMENT_PIN_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/env";
import { sendCommentPinEmail } from "@/services/email/email.service";
import { resendCommentPinSchema } from "@/lib/comments/validation";

export const runtime = "nodejs";

const MAX_RESENDS_PER_HOUR = 3;

/**
 * Re-issues a fresh PIN for an open (unverified) verification request. A new
 * pin is generated and emailed *before* anything is written to the DB — if
 * the send fails, the previous code stays valid rather than leaving the
 * candidate locked out with no working code at all.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resendCommentPinSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { requestId } = parsed.data;

  let cooldown, hourly;
  try {
    cooldown = await checkRateLimit(
      `comment-pin-resend-cooldown:${requestId}`,
      1,
      COMMENT_PIN_RESEND_COOLDOWN_SECONDS
    );
    hourly = await checkRateLimit(`comment-pin-resend:${requestId}`, MAX_RESENDS_PER_HOUR, 60 * 60);
  } catch (error) {
    console.error("[api/comments/resend-pin] rate limit check failed:", error);
    return apiError("internal_error", "Something went wrong. Please try again shortly.", 500);
  }
  if (!hourly.allowed) {
    return apiError("rate_limited", "Too many resend attempts. Please submit your comment again later.", 429);
  }
  if (!cooldown.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "Please wait before requesting another code.",
        },
        retryAfterSeconds: cooldown.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const verification = await db.commentVerification.findUnique({ where: { id: requestId } });
  if (!verification || verification.verifiedAt) {
    return apiError("invalid_request", "This verification request is invalid or already used.", 400);
  }

  const pin = generatePin();
  try {
    await sendCommentPinEmail({
      to: verification.email,
      pin,
      expiresInMinutes: Math.round(COMMENT_PIN_TTL_MS / 60000),
      fullName: verification.fullName,
    });
  } catch (error) {
    console.error("[api/comments/resend-pin] failed to send PIN email:", error);
    return apiError(
      "email_send_failed",
      "We couldn't send a verification email. Please check the address and try again.",
      502
    );
  }

  try {
    await db.commentVerification.update({
      where: { id: verification.id },
      data: {
        pinHash: hashToken(pin),
        attempts: 0,
        expiresAt: new Date(Date.now() + COMMENT_PIN_TTL_MS),
      },
    });
  } catch (error) {
    console.error("[api/comments/resend-pin] failed to persist new pin:", error);
    return apiError("internal_error", "We couldn't process your request. Please try again shortly.", 500);
  }

  return NextResponse.json({
    ok: true,
    retryAfterSeconds: COMMENT_PIN_RESEND_COOLDOWN_SECONDS,
    message: "We've emailed you a new verification code.",
  });
}
