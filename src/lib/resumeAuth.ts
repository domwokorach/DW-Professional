import { createHmac, timingSafeEqual } from "crypto";

const PIN_TTL_MS = 10 * 60 * 1000;
const DOWNLOAD_TTL_MS = 10 * 60 * 1000;

type PinPayload = { email: string; expiresAt: number };
type DownloadPayload = { email: string; expiresAt: number };

function getSecret(): string {
  const secret = process.env.RESUME_PIN_SECRET;
  if (!secret) throw new Error("RESUME_PIN_SECRET is not configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function encode(data: unknown): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function decode<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createPinChallenge(email: string, pin: string): string {
  const payload: PinPayload = { email, expiresAt: Date.now() + PIN_TTL_MS };
  const encoded = encode(payload);
  const sig = sign(`pin:${encoded}:${pin}`);
  return `${encoded}.${sig}`;
}

export function verifyPinChallenge(
  challenge: string,
  email: string,
  pin: string
): { valid: boolean; reason?: string } {
  const [encoded, sig] = challenge.split(".");
  if (!encoded || !sig) return { valid: false, reason: "Malformed verification code" };

  const payload = decode<PinPayload>(encoded);
  if (!payload) return { valid: false, reason: "Malformed verification code" };

  if (payload.email !== email) return { valid: false, reason: "Email does not match" };
  if (Date.now() > payload.expiresAt) return { valid: false, reason: "Code has expired" };

  const expectedSig = sign(`pin:${encoded}:${pin}`);
  if (!safeEqual(expectedSig, sig)) return { valid: false, reason: "Incorrect code" };

  return { valid: true };
}

export function createDownloadToken(email: string): string {
  const payload: DownloadPayload = { email, expiresAt: Date.now() + DOWNLOAD_TTL_MS };
  const encoded = encode(payload);
  const sig = sign(`download:${encoded}`);
  return `${encoded}.${sig}`;
}

export function verifyDownloadToken(token: string): { valid: boolean; email?: string } {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return { valid: false };

  const payload = decode<DownloadPayload>(encoded);
  if (!payload) return { valid: false };
  if (Date.now() > payload.expiresAt) return { valid: false };

  const expectedSig = sign(`download:${encoded}`);
  if (!safeEqual(expectedSig, sig)) return { valid: false };

  return { valid: true, email: payload.email };
}
