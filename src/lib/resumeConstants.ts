/**
 * Shared constants for the resume PIN verification flow.
 * Used by both the API routes (server) and the modal (client) so the
 * email copy, the challenge TTL, and the UI hints never drift apart.
 */

/** How long a verification PIN stays valid, in minutes. */
export const RESUME_PIN_TTL_MINUTES = 10;

/** How long the client waits before offering another code, in seconds. */
export const RESEND_COOLDOWN_SECONDS = 30;
