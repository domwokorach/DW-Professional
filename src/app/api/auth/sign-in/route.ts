import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { verifyPassword } from "@/lib/auth/passwords";
import { signInSchema } from "@/lib/auth/validation";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { createSession, contextFromRequest } from "@/lib/auth/session";
import { setAccessCookie, setRefreshCookie, setDeviceCookie } from "@/lib/auth/cookies";
import { extractClientIp } from "@/lib/auth/device";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { sendTemplateEmail } from "@/lib/email/mailer";
import NewDeviceSignInEmail from "@emails/templates/NewDeviceSignInEmail";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/auth/env";

export const runtime = "nodejs";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const WINDOW_SECONDS = 15 * 60;

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { email, password, rememberMe } = parsed.data;

  const ipLimit = await checkRateLimit(`sign-in:ip:${ip}`, MAX_ATTEMPTS_PER_WINDOW * 4, WINDOW_SECONDS);
  const emailLimit = await checkRateLimit(`sign-in:email:${email}`, MAX_ATTEMPTS_PER_WINDOW, WINDOW_SECONDS);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
    return apiError(
      "rate_limited",
      "Too many sign-in attempts. Please try again later.",
      429,
      { retryAfterSeconds: String(retryAfter) }
    );
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return apiError("invalid_credentials", "Incorrect email or password.", 401);
  }

  if (user.status === "DISABLED") {
    return apiError("account_disabled", "This account has been disabled. Contact an administrator.", 403);
  }
  if (user.status === "SUSPENDED") {
    return apiError("account_suspended", "This account has been suspended.", 403);
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    await logSecurityEvent({
      userId: user.id,
      type: "FAILED_SIGN_IN",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    });
    return apiError("invalid_credentials", "Incorrect email or password.", 401);
  }

  const ctx = contextFromRequest(request);
  const isNewDevice = ctx.deviceId
    ? (await db.session.count({ where: { userId: user.id, deviceId: ctx.deviceId } })) === 0
    : true;

  const { session, accessToken, refreshToken, refreshTtlSeconds } = await createSession(user, ctx, rememberMe);

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logSecurityEvent({
    userId: user.id,
    type: "SIGN_IN",
    sessionId: session.id,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  if (isNewDevice) {
    void sendTemplateEmail({
      to: user.email,
      subject: "New sign-in to your admin account",
      template: NewDeviceSignInEmail({
        deviceName: session.deviceName,
        browser: session.browser,
        operatingSystem: session.operatingSystem,
        ipAddress: ip,
        occurredAt: new Date().toLocaleString("en-GB"),
        devicesUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/devices`,
      }),
    });
  }

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
  });

  setAccessCookie(response, accessToken, ACCESS_TOKEN_TTL_SECONDS);
  setRefreshCookie(response, refreshToken, refreshTtlSeconds);
  setDeviceCookie(response, session.deviceId);
  return response;
}
