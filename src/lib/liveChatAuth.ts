import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Issues a short-lived token binding a visitor id to an expiry, signed with
 * SOCKET_SECRET. The secret itself never reaches the browser — only this
 * token does, and it verifies via constant-time comparison server-side.
 */
export function createLiveChatToken(visitorId: string, secret: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${visitorId}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyLiveChatToken(
  token: string,
  secret: string
): { visitorId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [visitorId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!visitorId || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  const expectedSignature = sign(`${visitorId}.${expiresAtRaw}`, secret);
  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return { visitorId };
}
