import { MAX_MESSAGE_LENGTH } from "@/lib/chat/constants";

// Matches ASCII control characters (0x00-0x1F, 0x7F) built via charCodes to
// avoid embedding literal unprintable bytes in this source file.
const CONTROL_CHARS = new RegExp(
  "[" +
    Array.from({ length: 32 }, (_, i) => String.fromCharCode(i)).join("") +
    String.fromCharCode(127) +
    "]",
  "g"
);

/** Trims, caps length, and strips control characters before a message is persisted or broadcast. */
export function sanitizeMessage(raw: string): string | null {
  const trimmed = raw.replace(CONTROL_CHARS, "").trim();
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;
  return trimmed;
}
