import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import { changePasswordSchema } from "@/lib/auth/validation";
import { apiError, validationError } from "@/lib/auth/apiError";
import { verifyPassword, hashPassword } from "@/lib/auth/passwords";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { sendTemplateEmail } from "@/lib/email/mailer";
import PasswordChangedEmail from "@emails/templates/PasswordChangedEmail";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const user = await db.user.findUnique({ where: { id: result.admin.userId } });
  if (!user) return apiError("not_found", "Account not found.", 404);

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return apiError("incorrect_password", "Current password is incorrect.", 400, {
      currentPassword: "Current password is incorrect.",
    });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Keep the current session alive (the admin is actively using it) but
  // revoke every other one — a changed password should not leave old
  // sessions on other devices valid.
  await revokeAllSessionsForUser(user.id, result.admin.sessionId);

  const ip = extractClientIp(request.headers) ?? "unknown";
  await logSecurityEvent({
    userId: user.id,
    type: "PASSWORD_CHANGED",
    sessionId: result.admin.sessionId,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  void sendTemplateEmail({
    to: user.email,
    subject: "Your password was changed",
    template: PasswordChangedEmail({ occurredAt: new Date().toLocaleString("en-GB"), ipAddress: ip }),
  });

  return NextResponse.json({ ok: true });
}
