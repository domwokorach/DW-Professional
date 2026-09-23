/**
 * Shared attachment rules for Live Chat / Admin Chat, following the same
 * pattern as the contact form's (src/lib/contact/attachments.ts): both the
 * browser (instant feedback before upload) and the server (never trust
 * client-side validation alone) run the same checks. A different, chat-
 * specific type list (adds DOC/TXT) and blob prefix from the contact form's
 * — attachments here are permanent conversation history, not a one-shot
 * email attachment cleaned up after sending.
 */

export const CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const CHAT_ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt";

export const CHAT_ATTACHMENT_TYPE_ERROR = "File must be PDF, DOC, DOCX, PNG, JPG, JPEG, or TXT.";
export const CHAT_ATTACHMENT_SIZE_ERROR = "This file is larger than the 5 MB limit.";

/** Permanent storage — never swept by a cleanup cron, unlike the contact form's tmp/ prefix. */
export const CHAT_ATTACHMENT_BLOB_PREFIX = "chat-uploads/";

export const CHAT_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "text/plain",
];

// Extensions/content-types that must never be accepted regardless of any
// future change to the allowlist above — defence in depth against
// executable or script uploads.
const BLOCKED_EXTENSIONS = [".exe", ".js", ".sh", ".bat", ".cmd", ".ps1", ".html", ".htm", ".svg"];

interface AttachmentTypeRule {
  extension: string;
  mimeTypes: string[];
  /** Leading bytes real files of this type start with; empty means "no reliable magic number" (plain text). */
  signature: number[];
}

const ALLOWED_ATTACHMENT_TYPES: AttachmentTypeRule[] = [
  { extension: ".pdf", mimeTypes: ["application/pdf"], signature: [0x25, 0x50, 0x44, 0x46] },
  // Legacy .doc is an OLE compound file — same signature as .xls/.ppt, but
  // the extension+MIME pairing above already narrows it to Word specifically.
  { extension: ".doc", mimeTypes: ["application/msword"], signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  {
    extension: ".docx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    signature: [0x50, 0x4b, 0x03, 0x04], // .docx is a zip archive under the hood
  },
  { extension: ".png", mimeTypes: ["image/png"], signature: [0x89, 0x50, 0x4e, 0x47] },
  { extension: ".jpg", mimeTypes: ["image/jpeg"], signature: [0xff, 0xd8, 0xff] },
  { extension: ".jpeg", mimeTypes: ["image/jpeg"], signature: [0xff, 0xd8, 0xff] },
  { extension: ".txt", mimeTypes: ["text/plain"], signature: [] },
];

function getExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Builds a collision-resistant, unguessable blob pathname — the original filename is stored separately, never trusted as a path. */
export function buildChatAttachmentPathname(filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150) || "file";
  return `${CHAT_ATTACHMENT_BLOB_PREFIX}${crypto.randomUUID()}-${safeName}`;
}

/** Cheap, synchronous checks — fast enough to run on every file selection for instant feedback. Never trusted alone. */
export function validateChatAttachmentMeta(file: { name: string; size: number; type: string }): string | null {
  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) return CHAT_ATTACHMENT_SIZE_ERROR;

  const extension = getExtension(file.name);
  if (BLOCKED_EXTENSIONS.includes(extension)) return CHAT_ATTACHMENT_TYPE_ERROR;

  const rule = ALLOWED_ATTACHMENT_TYPES.find((candidate) => candidate.extension === extension);
  if (!rule) return CHAT_ATTACHMENT_TYPE_ERROR;
  if (file.type && !rule.mimeTypes.includes(file.type)) return CHAT_ATTACHMENT_TYPE_ERROR;

  return null;
}

/**
 * Server-side-only re-verification against bytes already downloaded from
 * blob storage — extension/MIME can be spoofed by the client, this cannot.
 * A rule with an empty signature (plain text) is accepted on
 * extension+MIME alone; there is no reliable magic number for text.
 */
export function verifyChatAttachmentSignatureFromBuffer(buffer: Buffer, filename: string): boolean {
  const extension = getExtension(filename);
  if (BLOCKED_EXTENSIONS.includes(extension)) return false;

  const rule = ALLOWED_ATTACHMENT_TYPES.find((candidate) => candidate.extension === extension);
  if (!rule) return false;
  if (rule.signature.length === 0) return true;

  return rule.signature.every((byte, i) => buffer[i] === byte);
}
