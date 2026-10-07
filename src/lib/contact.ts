// Contact form rules shared by the browser form and the /api/contact route.
// The server re-runs every check; client validation is only for fast feedback.

export const PROJECT_TYPES = [
  'Website Development',
  'Web Application',
  'Full Stack Development',
  'Frontend Development',
  'Backend / API Development',
  'AI Application',
  'UI / UX Implementation',
  'Accessibility Improvement',
  'Performance Optimisation',
  'Consulting',
  'Recruitment',
  'Hiring Manager',
  'Other',
] as const;

export const MESSAGE_MAX = 2500;
export const MESSAGE_MIN = 10;
/**
 * Attachments sent through the server (the fallback when S3 isn't configured): Vercel Functions
 * accept request bodies up to 4.5 MB, so files stay under that with the form fields.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
/** Attachments uploaded straight to S3 with a presigned URL (they never pass through the server). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'] as const;
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',');
export const fileTooLarge = (max: number) => `Please upload a file smaller than ${max / 1024 / 1024} MB.`;
export const FILE_TOO_LARGE = fileTooLarge(MAX_FILE_BYTES);
/** Content type stored with each upload, by extension. */
export const CONTENT_TYPES: Record<(typeof ACCEPTED_EXTENSIONS)[number], string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export type ContactFields = {
  fullName: string;
  email: string;
  mobileNumber: string;
  company: string;
  projectType: string;
  message: string;
};
export type ContactField = keyof ContactFields | 'file';
export type ContactErrors = Partial<Record<ContactField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// International-friendly: optional +, digits, spaces, dashes, dots and brackets.
const PHONE = /^\+?[\d\s\-().]+$/;

export function validateField(field: keyof ContactFields, raw: string): string | undefined {
  const value = raw.trim();
  switch (field) {
    case 'fullName':
      if (value.length < 2) return 'Please enter your full name.';
      if (value.length > 100) return 'Please keep your name under 100 characters.';
      return;
    case 'email':
      if (!value) return 'Please enter your email address.';
      if (value.length > 254 || !EMAIL.test(value)) return 'Please enter a valid email address.';
      return;
    case 'mobileNumber': {
      if (!value) return; // optional
      const digits = value.replace(/\D/g, '').length;
      if (!PHONE.test(value) || digits < 6 || digits > 15) return 'Please enter a valid phone number, including the country code if outside the UK.';
      return;
    }
    case 'company':
      if (value.length > 120) return 'Please keep the company name under 120 characters.';
      return;
    case 'projectType':
      if (!(PROJECT_TYPES as readonly string[]).includes(value)) return 'Please choose a project type.';
      return;
    case 'message':
      if (!value) return 'Please enter a message.';
      if (value.length < MESSAGE_MIN) return `Please add a little more detail (at least ${MESSAGE_MIN} characters).`;
      if (value.length > MESSAGE_MAX) return `Please keep your message under ${MESSAGE_MAX.toLocaleString('en-GB')} characters.`;
      return;
  }
}

export function validateFields(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  for (const key of Object.keys(fields) as (keyof ContactFields)[]) {
    const error = validateField(key, fields[key]);
    if (error) errors[key] = error;
  }
  return errors;
}

export const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

/** Checks name and size (against `max`); the server additionally checks the file's leading bytes. */
export function validateFile(file: { name: string; size: number }, max: number = MAX_UPLOAD_BYTES): string | undefined {
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))) {
    return 'Please upload a PDF, DOC, DOCX, PNG, JPG or WEBP file.';
  }
  if (file.size === 0) return 'That file appears to be empty.';
  if (file.size > max) return fileTooLarge(max);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Strips any path, keeps a conservative character set, and caps the length. */
export function safeFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? 'attachment';
  const ext = extensionOf(base);
  const stem = base.slice(0, base.length - ext.length).replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'attachment';
  return `${stem}${ext}`;
}

/** Leading-byte signatures, so a renamed executable can't pass as a PDF or image. */
export function matchesSignature(name: string, bytes: Uint8Array) {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (extensionOf(name)) {
    case '.pdf': return starts(0x25, 0x50, 0x44, 0x46); // %PDF
    case '.png': return starts(0x89, 0x50, 0x4e, 0x47);
    case '.jpg':
    case '.jpeg': return starts(0xff, 0xd8, 0xff);
    case '.webp': return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50; // RIFF....WEBP
    case '.docx': return starts(0x50, 0x4b, 0x03, 0x04); // ZIP container
    case '.doc': return starts(0xd0, 0xcf, 0x11, 0xe0); // OLE2 container
    default: return false;
  }
}
