import { createHmac, timingSafeEqual } from "node:crypto";

export function signRelay(body: string, timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyRelay(body: string, timestamp: string, signature: string, secret: string): boolean {
  if (!secret || !/^\d+$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 30_000 || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signRelay(body, timestamp, secret), "hex"), Buffer.from(signature, "hex"));
}
