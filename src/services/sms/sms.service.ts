import { twilioVerifyProvider } from "./twilio.provider";

const provider = twilioVerifyProvider;

/**
 * Sends a one-time SMS code via Twilio Verify. Like sendCommentPinEmail, this
 * gates a user-visible step (the caller shows "check your phone" only after
 * this resolves) so a provider failure must throw rather than return a
 * swallowed `{ ok: false }`.
 */
export async function sendCommentPinSms(to: string): Promise<void> {
  const result = await provider.send(to);
  if (!result.ok) {
    throw new Error(`Failed to send comment verification SMS: ${result.error ?? "unknown error"}`);
  }
}

/** Returns whether `code` is the currently valid Twilio Verify code for `to`. Throws only on a genuine provider/network failure. */
export async function checkCommentPinSms(to: string, code: string): Promise<boolean> {
  const result = await provider.check(to, code);
  if (!result.ok) {
    throw new Error(`Failed to check comment verification SMS: ${result.error ?? "unknown error"}`);
  }
  return result.approved ?? false;
}
