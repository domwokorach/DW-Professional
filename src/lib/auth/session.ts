import { db } from "@/lib/database/db";
import type { Session, User } from "@prisma/client";
import { generateOpaqueToken, hashToken, signAccessToken } from "./tokens";
import { parseDeviceInfo, generateDeviceId, extractClientIp } from "./device";
import {
  REFRESH_TOKEN_TTL_SECONDS_DEFAULT,
  REFRESH_TOKEN_TTL_SECONDS_REMEMBER,
} from "./env";

export interface NewSessionResult {
  session: Session;
  accessToken: string;
  refreshToken: string;
  refreshTtlSeconds: number;
}

interface RequestContext {
  userAgent: string | null;
  ipAddress: string | null;
  deviceId?: string | null;
}

export function contextFromRequest(request: Request): RequestContext {
  return {
    userAgent: request.headers.get("user-agent"),
    ipAddress: extractClientIp(request.headers),
    deviceId: request.headers.get("cookie")?.match(/admin_device=([^;]+)/)?.[1] ?? null,
  };
}

export async function createSession(
  user: User,
  ctx: RequestContext,
  rememberMe: boolean
): Promise<NewSessionResult> {
  const refreshTtlSeconds = rememberMe
    ? REFRESH_TOKEN_TTL_SECONDS_REMEMBER
    : REFRESH_TOKEN_TTL_SECONDS_DEFAULT;

  const refreshToken = generateOpaqueToken();
  const deviceInfo = parseDeviceInfo(ctx.userAgent);
  const deviceId = ctx.deviceId || generateDeviceId();

  const session = await db.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      operatingSystem: deviceInfo.operatingSystem,
      browser: deviceInfo.browser,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  });

  return { session, accessToken, refreshToken, refreshTtlSeconds };
}

export async function rotateSession(
  session: Session,
  ctx: RequestContext
): Promise<{ accessToken: string; refreshToken: string; refreshTtlSeconds: number } | null> {
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.status !== "ACTIVE") return null;

  const refreshToken = generateOpaqueToken();
  const remainingMs = session.expiresAt.getTime() - Date.now();
  const refreshTtlSeconds = Math.max(60, Math.floor(remainingMs / 1000));

  await db.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(refreshToken),
      lastActiveAt: new Date(),
      ipAddress: ctx.ipAddress ?? session.ipAddress,
      userAgent: ctx.userAgent ?? session.userAgent,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  });

  return { accessToken, refreshToken, refreshTtlSeconds };
}

export async function findActiveSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
  const session = await db.session.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsForUser(userId: string, exceptSessionId?: string): Promise<void> {
  await db.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
}
