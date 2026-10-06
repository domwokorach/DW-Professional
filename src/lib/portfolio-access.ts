// Portfolio Access form rules shared by the browser form and the /api/portfolio-access route.
// The server re-runs every check and is the final authority; client validation is only for fast feedback.

/** Admin → Sessions (/admin/portfolio-access redirects here) and one candidate's session page. */
export const ADMIN_SESSIONS_PATH = '/admin/sessions';
export const adminSessionPath = (id: string) => `${ADMIN_SESSIONS_PATH}/${encodeURIComponent(id)}`;

export type AccessFields = {
  fullName: string;
  email: string;
  mobile: string;
  company: string;
  /** Optional professional profile links (absolute http(s) URLs once cleaned). */
  linkedin: string;
  companyWebsite: string;
  portfolio: string;
};
export type AccessField = keyof AccessFields;
/** Field errors; `attachment` is the optional Upload / Camera file. */
export type AccessErrors = Partial<Record<AccessField | 'attachment', string>>;

export const ACCESS_FIELDS: AccessField[] = ['fullName', 'email', 'mobile', 'company', 'linkedin', 'companyWebsite', 'portfolio'];
export const ACCESS_LIMITS = {
  fullName: 100, email: 254, mobile: 24, company: 120, linkedin: 300, companyWebsite: 300, portfolio: 300,
} as const;
const URL_FIELDS = new Set<AccessField>(['linkedin', 'companyWebsite', 'portfolio']);

/**
 * A typed link as an absolute URL, or null if it can't be one. "acme.com" becomes "https://acme.com/"; only http(s),
 * a host with a dot, and no embedded user:password are accepted.
 */
export function normaliseUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value || /\s/.test(value)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)) return null;
    url.hash = '';
    return url.href.length <= 300 ? url.href : null;
  } catch {
    return null;
  }
}

/** A personal LinkedIn profile: linkedin.com (any subdomain, e.g. uk.) and a /in/ or /pub/ path. */
export function isLinkedInProfile(href: string): boolean {
  const url = new URL(href);
  return /(^|\.)linkedin\.com$/i.test(url.hostname) && /^\/(in|pub)\/[^/]+/i.test(url.pathname);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// International-friendly: optional leading +, then digits, spaces, dashes, dots and brackets
// ("07700 900123", "+44 7700 900123", "+1 (415) 555-0100", "0049 151 23456789").
const PHONE = /^\+?[\d\s\-().]+$/;
// Control characters never belong in these single-line fields.
const CONTROL = /[\u0000-\u001f\u007f]/;

export function validateAccessField(field: AccessField, raw: string): string | undefined {
  const value = raw.trim();
  if (value.length > ACCESS_LIMITS[field]) {
    return field === 'company'
      ? `Please keep the company name under ${ACCESS_LIMITS.company} characters.`
      : field === 'fullName'
        ? `Please keep your name under ${ACCESS_LIMITS.fullName} characters.`
        : field === 'email'
          ? 'Please enter a valid email address.'
          : URL_FIELDS.has(field)
            ? 'Please use a shorter web address.'
            : 'Please enter a valid mobile number, including the country code if outside the UK.';
  }
  if (CONTROL.test(value)) return 'Please remove any unusual characters.';
  switch (field) {
    case 'fullName':
      if (!value) return 'Please enter your full name.';
      if (value.length < 2) return 'Please enter your full name.';
      return;
    case 'email':
      if (!value) return 'Please enter your email address.';
      if (!EMAIL.test(value)) return 'Please enter a valid email address, like name@company.com.';
      return;
    case 'mobile': {
      if (!value) return 'Please enter your mobile number.';
      // 7–15 digits covers UK and international numbers (E.164 allows at most 15).
      const digits = value.replace(/\D/g, '').length;
      if (!PHONE.test(value) || digits < 7 || digits > 15) {
        return 'Please enter a valid mobile number, including the country code if outside the UK.';
      }
      return;
    }
    case 'company':
      return; // optional, like the contact form's Company field
    case 'linkedin':
    case 'companyWebsite':
    case 'portfolio': {
      if (!value) return; // optional
      const href = normaliseUrl(value);
      if (!href) return 'Please enter a valid web address, like https://example.com.';
      if (field === 'linkedin' && !isLinkedInProfile(href)) {
        return 'Please enter your LinkedIn profile link, like https://www.linkedin.com/in/your-name.';
      }
      return;
    }
  }
}

export function validateAccess(fields: AccessFields): AccessErrors {
  const errors: AccessErrors = {};
  for (const key of ACCESS_FIELDS) {
    const error = validateAccessField(key, fields[key]);
    if (error) errors[key] = error;
  }
  return errors;
}

/** Trims every field and collapses runs of whitespace (the values are single-line); links become absolute URLs. */
export function cleanAccess(fields: AccessFields): AccessFields {
  const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();
  const link = (s: string) => normaliseUrl(s) ?? '';
  return {
    fullName: tidy(fields.fullName),
    email: fields.email.trim(),
    mobile: tidy(fields.mobile),
    company: tidy(fields.company),
    linkedin: link(fields.linkedin),
    companyWebsite: link(fields.companyWebsite),
    portfolio: link(fields.portfolio),
  };
}

/** What /api/portfolio-access/site-preview returns for a company website. Text only: no remote images. */
export type SitePreview = { url: string; host: string; name: string | null; description: string | null };

// ---- Optional attachment (Upload or Camera) ------------------------------------------------------------------

/**
 * The file travels through the server with the form (Vercel caps request bodies at 4.5 MB), so 4 MB is the limit.
 * Photos are resized in the browser first (see ATTACHMENT_IMAGE_MAX_SIDE), so camera pictures land well below it.
 */
export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
/** Longest side a photo is scaled down to before upload. */
export const ATTACHMENT_IMAGE_MAX_SIDE = 2000;
/**
 * What the server stores: PNG and JPG images, PDF, DOC and DOCX. PNGs are kept as PNG; any other image a phone
 * offers (HEIC, WEBP…) and every camera photo is converted to JPEG in the browser first.
 */
export const ATTACHMENT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx'] as const;
export const ATTACHMENT_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;
/** The picker accepts any image (so phones can offer HEIC photos for conversion) plus the document types. */
export const ATTACHMENT_ACCEPT = 'image/*,.pdf,.doc,.docx';
export type AttachmentSource = 'upload' | 'camera';

export const ATTACHMENT_ERRORS = {
  type: 'Please choose a PDF, DOC or DOCX document, or a PNG or JPG image.',
  size: `Please choose a file smaller than ${ATTACHMENT_MAX_BYTES / 1024 / 1024} MB.`,
  empty: 'That file appears to be empty. Please choose another.',
  image: 'That image couldn’t be read. Please try a JPG or PNG instead.',
  content: 'That file doesn’t look like the type its name suggests. Please choose another.',
} as const;

const extension = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};
/** Human label for a stored file's type, e.g. "PDF document", "Word document (DOCX)". */
export function attachmentTypeLabel(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf': return 'PDF document';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'Word document (DOCX)';
    case 'application/msword': return 'Word document (DOC)';
    case 'image/png': return 'PNG image';
    case 'image/jpeg': return 'JPG image';
    default: return 'File';
  }
}
/** Types the admin can preview in the page (the others open as a download). */
export const isPreviewable = (mimeType: string) => mimeType === 'application/pdf' || mimeType.startsWith('image/');

export const isAttachmentDocument = (name: string) => (ATTACHMENT_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension(name));

/** Name and size checks for the file that will be sent (after any image conversion). */
export function attachmentProblem(file: { name: string; size: number }): string | undefined {
  if (!(ATTACHMENT_EXTENSIONS as readonly string[]).includes(extension(file.name))) return ATTACHMENT_ERRORS.type;
  if (file.size === 0) return ATTACHMENT_ERRORS.empty;
  if (file.size > ATTACHMENT_MAX_BYTES) return ATTACHMENT_ERRORS.size;
}
