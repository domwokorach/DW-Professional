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

/**
 * Thrown by a token fetcher when the request itself failed in a way retrying
 * cannot fix (e.g. the token endpoint rejected the payload, or the server
 * reports live chat isn't configured) — as opposed to a transient network
 * error, which should keep retrying. useSocket checks for this type to stop
 * reconnection and surface "Unable to authenticate chat" instead of looping
 * forever against a request that will never succeed.
 */
export class ChatUnavailableError extends Error {
  constructor() {
    super("Unable to authenticate chat");
    this.name = "ChatUnavailableError";
  }
}
