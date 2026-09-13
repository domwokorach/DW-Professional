function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getAccessTokenSecret(): string {
  return required("JWT_ACCESS_SECRET");
}

/** Keys the HMAC used to hash refresh/reset/email-change tokens before storage — see tokens.ts. */
export function getTokenHashPepper(): string {
  return required("TOKEN_HASH_PEPPER");
}

export const ACCESS_TOKEN_TTL_SECONDS = 12 * 60; // 12 minutes
export const REFRESH_TOKEN_TTL_SECONDS_DEFAULT = 7 * 24 * 60 * 60; // 7 days
export const REFRESH_TOKEN_TTL_SECONDS_REMEMBER = 30 * 24 * 60 * 60; // 30 days
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Canonical origin used to build absolute links in transactional emails. Falls back to the public app URL for back-compat. No trailing slash. */
export function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return url.replace(/\/$/, "");
}
