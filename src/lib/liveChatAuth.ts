import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export type LiveChatTokenClaims =
  | { role: "visitor"; visitorId: string; conversationId: string }
  | { role: "admin"; adminId: string };

/**
 * Issues a short-lived token binding either a visitor to one specific
 * conversation, or an authenticated admin, signed with SOCKET_SECRET. The
 * secret itself never reaches the browser — only this token does, and it
 * verifies via constant-time comparison server-side.
 */
export function createLiveChatToken(claims: LiveChatTokenClaims, secret: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${JSON.stringify(claims)}.${expiresAt}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload, secret)}`;
}

export function verifyLiveChatToken(token: string, secret: string): LiveChatTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expectedSignature = sign(payload, secret);
  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  const separatorIndex = payload.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const claimsRaw = payload.slice(0, separatorIndex);
  const expiresAt = Number(payload.slice(separatorIndex + 1));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  try {
    const claims = JSON.parse(claimsRaw) as LiveChatTokenClaims;
    if (claims.role === "visitor" && claims.visitorId && claims.conversationId) return claims;
    if (claims.role === "admin" && claims.adminId) return claims;
    return null;
  } catch {
    return null;
  }
}
