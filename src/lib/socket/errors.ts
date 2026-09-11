/**
 * Thrown by a token fetcher (see hooks/use-admin-socket.ts) when the caller's
 * session is authenticated but no longer authorized — distinct from a
 * transient network/server failure, which should keep retrying instead of
 * giving up. useSocket checks for this type to stop reconnection and surface
 * a "session expired" state rather than looping forever against a token
 * request that will never succeed.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}
