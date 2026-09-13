import { NextRequest } from "next/server";
import { db } from "@/lib/database/db";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { apiError, validationError } from "@/lib/auth/apiError";
import { hashToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/passwords";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { sendPasswordChangedEmail } from "@/services/email/email.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    return apiError("invalid_token", "This reset link is invalid or has expired. Request a new one.", 400);
  }

  const user = await db.user.findUnique({ where: { id: resetToken.userId } });
  if (!user) {
    return apiError("invalid_token", "This reset link is invalid or has expired. Request a new one.", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const ip = extractClientIp(request.headers) ?? "unknown";

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  // Resetting the password invalidates every existing session — a stolen
  // refresh token or access token becomes worthless the instant this runs.
  await revokeAllSessionsForUser(user.id);

  await logSecurityEvent({
    userId: user.id,
    type: "PASSWORD_RESET_COMPLETED",
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  void sendPasswordChangedEmail({
    to: user.email,
    occurredAt: new Date().toLocaleString("en-GB"),
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true, message: "Password reset. Please sign in again." });
}
