import { randomBytes, createHmac } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getAccessTokenSecret, getTokenHashPepper, ACCESS_TOKEN_TTL_SECONDS } from "./env";
import type { Role } from "@prisma/client";

export interface AccessTokenClaims extends JWTPayload {
  sub: string;
  email: string;
  role: Role;
  sessionId: string;
}

function accessSecretKey(): Uint8Array {
  return new TextEncoder().encode(getAccessTokenSecret());
}

export async function signAccessToken(claims: Omit<AccessTokenClaims, "iat" | "exp">): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessSecretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.sessionId !== "string") return null;
    return payload as AccessTokenClaims;
  } catch {
    return null;
  }
}

/** Opaque, high-entropy refresh/reset/verification tokens: only a keyed hash is ever persisted. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * HMAC-SHA256 keyed with TOKEN_HASH_PEPPER, not a plain SHA-256 digest — a
 * database leak alone (schema + rows, no environment secrets) is then
 * insufficient to verify a guessed or brute-forced token against the stored
 * hash, since the pepper never leaves the environment.
 */
export function hashToken(token: string): string {
  return createHmac("sha256", getTokenHashPepper()).update(token).digest("hex");
}
