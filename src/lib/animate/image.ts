/**
 * Shared rules for the portrait-animation upload — mirrors the pattern in
 * src/lib/contact/attachments.ts. Runway accepts base64 data URIs up to 5 MB,
 * so the cap here matches that limit exactly (rather than the contact form's
 * separate 5 MB attachment cap, which is coincidentally the same number).
 */

export const PORTRAIT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB — Runway's data URI limit
export const PORTRAIT_ACCEPT = ".png,.jpg,.jpeg";

export const PORTRAIT_TYPE_ERROR = "Photo must be PNG, JPG, or JPEG.";
export const PORTRAIT_SIZE_ERROR = "Maximum photo size is 5 MB.";

interface ImageTypeRule {
  extension: string;
  mimeType: string;
  signature: number[];
}

const ALLOWED_IMAGE_TYPES: ImageTypeRule[] = [
  { extension: ".png", mimeType: "image/png", signature: [0x89, 0x50, 0x4e, 0x47] },
  { extension: ".jpg", mimeType: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { extension: ".jpeg", mimeType: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
];

function getExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

export function validatePortraitMeta(file: { name: string; size: number; type: string }): string | null {
  if (file.size > PORTRAIT_MAX_BYTES) return PORTRAIT_SIZE_ERROR;

  const extension = getExtension(file.name);
  const rule = ALLOWED_IMAGE_TYPES.find((candidate) => candidate.extension === extension);
  if (!rule) return PORTRAIT_TYPE_ERROR;
  if (file.type && file.type !== rule.mimeType) return PORTRAIT_TYPE_ERROR;

  return null;
}

/**
 * Reads the first bytes and checks them against the expected file signature,
 * then returns a base64 data URI built from those verified bytes — server-side
 * defense-in-depth against a renamed/spoofed extension (same approach as
 * verifyAttachmentSignature in src/lib/contact/attachments.ts).
 */
export async function verifyAndEncodePortrait(file: File): Promise<string | null> {
  const extension = getExtension(file.name);
  const rule = ALLOWED_IMAGE_TYPES.find((candidate) => candidate.extension === extension);
  if (!rule) return null;

  const buffer = new Uint8Array(await file.arrayBuffer());
  const matchesSignature = rule.signature.every((byte, i) => buffer[i] === byte);
  if (!matchesSignature) return null;

  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${rule.mimeType};base64,${base64}`;
}
