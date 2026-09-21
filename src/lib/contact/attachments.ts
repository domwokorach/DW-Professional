/**
 * Shared attachment rules for the "Have a project in mind?" form — the same
 * constants and validation function run in the browser (before upload) and
 * on the server (before the file is trusted enough to email), since both
 * sides see the same Web File API shape.
 */

export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const ATTACHMENT_ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg";

export const ATTACHMENT_TYPE_ERROR = "File must be PDF, DOCX, PNG, JPG, or JPEG.";
export const ATTACHMENT_SIZE_ERROR = "Maximum file size is 5 MB.";

interface AttachmentTypeRule {
  extension: string;
  mimeTypes: string[];
  /** Leading bytes real files of this type start with, checked server-side to catch a renamed/spoofed extension. */
  signature: number[];
}

const ALLOWED_ATTACHMENT_TYPES: AttachmentTypeRule[] = [
  { extension: ".pdf", mimeTypes: ["application/pdf"], signature: [0x25, 0x50, 0x44, 0x46] },
  {
    extension: ".docx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    // .docx is a zip archive under the hood.
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  { extension: ".png", mimeTypes: ["image/png"], signature: [0x89, 0x50, 0x4e, 0x47] },
  { extension: ".jpg", mimeTypes: ["image/jpeg"], signature: [0xff, 0xd8, 0xff] },
  { extension: ".jpeg", mimeTypes: ["image/jpeg"], signature: [0xff, 0xd8, 0xff] },
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

/**
 * Cheap, synchronous checks (extension, declared MIME type, size) — fast
 * enough to run on every file selection/drop for instant feedback.
 */
export function validateAttachmentMeta(file: { name: string; size: number; type: string }): string | null {
  if (file.size > ATTACHMENT_MAX_BYTES) return ATTACHMENT_SIZE_ERROR;

  const extension = getExtension(file.name);
  const rule = ALLOWED_ATTACHMENT_TYPES.find((candidate) => candidate.extension === extension);
  if (!rule) return ATTACHMENT_TYPE_ERROR;
  if (file.type && !rule.mimeTypes.includes(file.type)) return ATTACHMENT_TYPE_ERROR;

  return null;
}

/**
 * Reads the first few bytes and checks them against the expected file
 * signature — a renamed executable or arbitrary blob won't pass this even
 * if its extension and reported MIME type were spoofed. Server-side only
 * defense-in-depth; the client already ran validateAttachmentMeta.
 */
export async function verifyAttachmentSignature(file: File): Promise<boolean> {
  const extension = getExtension(file.name);
  const rule = ALLOWED_ATTACHMENT_TYPES.find((candidate) => candidate.extension === extension);
  if (!rule) return false;

  const head = new Uint8Array(await file.slice(0, rule.signature.length).arrayBuffer());
  return rule.signature.every((byte, i) => head[i] === byte);
}
