export const SOCKET_PORT = Number(process.env.SOCKET_PORT ?? 4001);
export const SOCKET_CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN ?? "http://localhost:3000";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

/** Short-lived token TTL, matches lib/auth token signing in liveChatAuth-style helpers. */
export const SOCKET_TOKEN_TTL_MS = 5 * 60 * 1000;
