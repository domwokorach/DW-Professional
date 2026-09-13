import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import { changeEmailSchema } from "@/lib/auth/validation";
import { apiError, validationError } from "@/lib/auth/apiError";
import { verifyPassword } from "@/lib/auth/passwords";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { EMAIL_CHANGE_TTL_MS, getAppUrl } from "@/lib/auth/env";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { sendEmailChangeVerificationEmail } from "@/services/email/email.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const parsed = changeEmailSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const user = await db.user.findUnique({ where: { id: result.admin.userId } });
  if (!user) return apiError("not_found", "Account not found.", 404);

  const validPassword = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!validPassword) {
    return apiError("incorrect_password", "Your current password is incorrect.", 400, {
      currentPassword: "Your current password is incorrect.",
    });
  }

  if (parsed.data.newEmail === user.email) {
    return apiError("same_email", "That is already your current email address.", 400, {
      newEmail: "That is already your current email address.",
    });
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.newEmail } });
  if (existing) {
    return apiError("email_in_use", "That email address is already in use.", 409, {
      newEmail: "That email address is already in use.",
    });
  }

  const token = generateOpaqueToken();
  await db.emailChangeRequest.create({
    data: {
      userId: user.id,
      oldEmail: user.email,
      newEmail: parsed.data.newEmail,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
    },
  });

  await logSecurityEvent({
    userId: user.id,
    type: "EMAIL_CHANGE_REQUESTED",
    sessionId: result.admin.sessionId,
    ipAddress: extractClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  const verifyUrl = `${getAppUrl()}/auth/verify-email-change?token=${token}`;
  void sendEmailChangeVerificationEmail({
    to: parsed.data.newEmail,
    verifyUrl,
    newEmail: parsed.data.newEmail,
    expiresInMinutes: Math.round(EMAIL_CHANGE_TTL_MS / 60000),
  });

  return NextResponse.json({
    ok: true,
    message: `A verification link has been sent to ${parsed.data.newEmail}. Your email won't change until you confirm it.`,
  });
}
