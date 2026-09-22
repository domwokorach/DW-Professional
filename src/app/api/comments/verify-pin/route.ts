import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { hashToken } from "@/lib/auth/tokens";
import { verifyCommentPinSchema } from "@/lib/comments/validation";
import { toPublicComment } from "@/lib/comments/toPublicComment";

export const runtime = "nodejs";

const MAX_PIN_ATTEMPTS = 5;

/**
 * Step 2 of comment submission: confirm the PIN emailed by /send-pin, then
 * create the actual Comment row (still PENDING — an admin still has to
 * approve it before it appears on the site).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = verifyCommentPinSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { requestId, pin } = parsed.data;

  let attemptLimit;
  try {
    attemptLimit = await checkRateLimit(`comment-pin-verify:request:${requestId}`, MAX_PIN_ATTEMPTS, 10 * 60);
  } catch (error) {
    console.error("[api/comments/verify-pin] rate limit check failed:", error);
    return apiError("internal_error", "Something went wrong. Please try again shortly.", 500);
  }
  if (!attemptLimit.allowed) {
    return apiError("rate_limited", "Too many attempts. Please request a new code.", 429);
  }

  const verification = await db.commentVerification.findUnique({ where: { id: requestId } });
  if (!verification || verification.verifiedAt) {
    return apiError("invalid_request", "This verification request is invalid or already used.", 400);
  }
  if (verification.expiresAt.getTime() < Date.now()) {
    return apiError("expired_code", "This code has expired. Please submit your comment again.", 400);
  }
  if (verification.attempts >= MAX_PIN_ATTEMPTS) {
    return apiError("too_many_attempts", "Too many incorrect attempts. Please submit your comment again.", 429);
  }

  const codeIsCorrect = hashToken(pin) === verification.pinHash;

  if (!codeIsCorrect) {
    await db.commentVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    return apiError("invalid_code", "That code isn't right. Please check and try again.", 400, {
      pin: "Incorrect code.",
    });
  }

  let comment;
  try {
    [comment] = await db.$transaction([
      db.comment.create({
        data: {
          fullName: verification.fullName,
          company: verification.company,
          companyId: verification.companyId,
          companyNumber: verification.companyNumber,
          companyStatus: verification.companyStatus,
          companySource: verification.companySource,
          companyDomain: verification.companyDomain,
          companyLogo: verification.companyLogo,
          companyIndustry: verification.companyIndustry,
          companyLocation: verification.companyLocation,
          companyPostcode: verification.companyPostcode,
          body: verification.body,
          avatarUrl: verification.avatarUrl,
          status: "PENDING",
        },
      }),
      db.commentVerification.update({
        where: { id: verification.id },
        data: { verifiedAt: new Date() },
      }),
    ]);
  } catch (error) {
    console.error("[api/comments/verify-pin] failed to save comment:", error);
    return apiError("internal_error", "We couldn't save your comment. Please try again shortly.", 500);
  }

  return NextResponse.json(
    { ok: true, comment: toPublicComment(comment), message: "Thanks! Your comment is awaiting review." },
    { status: 201 }
  );
}
