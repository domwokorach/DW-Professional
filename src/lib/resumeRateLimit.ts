const REQUEST_COOLDOWN_MS = 30 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

const lastRequestAt = new Map<string, number>();
const verifyAttempts = new Map<string, number>();

export function isRequestOnCooldown(email: string): boolean {
  const last = lastRequestAt.get(email);
  return typeof last === "number" && Date.now() - last < REQUEST_COOLDOWN_MS;
}

export function markRequested(email: string): void {
  lastRequestAt.set(email, Date.now());
}

export function registerVerifyAttempt(challenge: string): boolean {
  const attempts = (verifyAttempts.get(challenge) ?? 0) + 1;
  verifyAttempts.set(challenge, attempts);
  return attempts <= MAX_VERIFY_ATTEMPTS;
}

export function clearVerifyAttempts(challenge: string): void {
  verifyAttempts.delete(challenge);
}
