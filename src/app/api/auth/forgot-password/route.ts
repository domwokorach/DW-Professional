import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { PASSWORD_RESET_TTL_MS } from "@/lib/auth/env";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { sendTemplateEmail } from "@/lib/email/mailer";
import PasswordResetEmail from "@emails/templates/PasswordResetEmail";

export const runtime = "nodejs";

function genericResponse() {
  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a password reset link has been sent.",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const ip = extractClientIp(request.headers) ?? "unknown";
  const ipLimit = await checkRateLimit(`forgot-password:ip:${ip}`, 10, 60 * 60);
  const emailLimit = await checkRateLimit(`forgot-password:email:${parsed.data.email}`, 3, 60 * 60);
  // Rate limits are enforced but the response is identical either way, so
  // hitting the limit doesn't itself reveal whether the account exists.
  if (!ipLimit.allowed || !emailLimit.allowed) return genericResponse();

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  if (user && user.status === "ACTIVE") {
    const token = generateOpaqueToken();
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    await logSecurityEvent({
      userId: user.id,
      type: "PASSWORD_RESET_REQUESTED",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/reset-password?token=${token}`;
    void sendTemplateEmail({
      to: user.email,
      subject: "Reset your admin password",
      template: PasswordResetEmail({ resetUrl, expiresInMinutes: Math.round(PASSWORD_RESET_TTL_MS / 60000) }),
    });
  }

  // Always return the same generic response — never reveal whether the
  // account exists (prevents account enumeration).
  return genericResponse();
}
