// Comment rules shared by the browser form and the /api/comments route.
// The server re-runs every check and cleans the text; client validation is only for fast feedback.

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const EMAIL_MAX = 254;
export const COMPANY_MAX = 80;
export const COMMENT_MIN = 10;
export const COMMENT_MAX = 600;

/** Optional avatar: uploaded straight to the private S3 bucket. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
/** One message for "too big", used by the form, the upload endpoint and the submit check. */
export const AVATAR_TOO_LARGE = `Avatar image must be ${AVATAR_MAX_BYTES / 1024 / 1024} MB or smaller.`;
export const AVATAR_BAD_TYPE = 'Please choose a JPG, PNG or WebP image.';
export const AVATAR_UNREADABLE = 'That file can\u2019t be read as an image. Please choose another.';
export const AVATAR_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' } as const;
export const AVATAR_ACCEPT = Object.keys(AVATAR_TYPES).join(',');

/** Shown next to the checkbox and stored as given; the server refuses a submission without it. */
export const CONSENT_TEXT = 'I give permission for my submitted information to be used to review and moderate my comment.';

export type CommentFields = { fullName: string; email: string; company: string; comment: string };
export type CommentField = keyof CommentFields;
export type CommentFormField = CommentField | 'consent' | 'avatar';
export type CommentErrors = Partial<Record<CommentFormField, string>>;

/** What the public feed gets for one approved comment. Never includes email, IP, device or status. */
export type PublicComment = {
  id: string;
  fullName: string;
  company: string | null;
  comment: string;
  /** Same-origin URL of the avatar image, or null. */
  avatarUrl: string | null;
  /** ISO timestamp of submission. */
  createdAt: string;
  /** An admin marked it verified (separate from approval); shows the verified badge on the avatar. */
  isVerified: boolean;
  /** An admin chose to show its text in italics. */
  isItalic: boolean;
};
export type CommentStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED';

// Control characters (except tab/newline), zero-width and bidi-override characters: invisible, never wanted.
// eslint-disable-next-line no-control-regex
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g;
/** Anything that looks like an HTML/XML tag or comment. */
const MARKUP = /<\s*\/?\s*[a-z!?][^>]*>|<!--/i;
const LINK = /\b(?:https?:\/\/|www\.)\S+/i;
const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

/**
 * Normalises user text for storage: Unicode NFC, invisible characters removed, line endings unified, runs of
 * spaces collapsed, at most one blank line in a row, edges trimmed. `multiline` keeps line breaks (comments);
 * otherwise everything becomes one line (names).
 */
export function cleanText(raw: string, multiline = false): string {
  let s = String(raw ?? '').normalize('NFC').replace(INVISIBLE, '').replace(/\r\n?/g, '\n');
  if (multiline) {
    s = s.replace(/[^\S\n]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n');
  } else {
    s = s.replace(/\s+/g, ' ');
  }
  return s.trim();
}

export function validateCommentField(field: CommentField, raw: string): string | undefined {
  const value = cleanText(raw, field === 'comment');
  if (value && MARKUP.test(value)) return 'Please use plain text only: HTML and markup aren’t allowed.';
  switch (field) {
    case 'fullName':
      if (value.length < NAME_MIN) return 'Please enter your full name.';
      if (value.length > NAME_MAX) return `Please keep your name under ${NAME_MAX} characters.`;
      if (LINK.test(value)) return 'Please don’t include links in your name.';
      return;
    case 'email':
      if (!value) return 'Please enter your email address.';
      if (value.length > EMAIL_MAX || !EMAIL.test(value)) return 'Please enter a valid email address.';
      return;
    case 'company':
      if (value.length > COMPANY_MAX) return `Please keep this under ${COMPANY_MAX} characters.`;
      if (LINK.test(value)) return 'Please don’t include links here.';
      return;
    case 'comment':
      if (!value) return 'Please write your comment.';
      if (value.length < COMMENT_MIN) return `Please write at least ${COMMENT_MIN} characters.`;
      if (value.length > COMMENT_MAX) return `Please keep your comment under ${COMMENT_MAX} characters.`;
      if (LINK.test(value)) return 'Please don’t include links in your comment.';
      return;
  }
}

export const CONSENT_REQUIRED = 'Please give permission so your comment can be reviewed.';

export function validateComment(fields: CommentFields, consent: boolean): CommentErrors {
  const errors: CommentErrors = {};
  (Object.keys(fields) as CommentField[]).forEach((f) => {
    const message = validateCommentField(f, fields[f]);
    if (message) errors[f] = message;
  });
  if (!consent) errors.consent = CONSENT_REQUIRED;
  return errors;
}

/** The cleaned values that get stored (validate first). Emails are stored lower-cased. */
export function cleanComment(fields: CommentFields): CommentFields {
  return {
    fullName: cleanText(fields.fullName),
    email: cleanText(fields.email).toLowerCase(),
    company: cleanText(fields.company),
    comment: cleanText(fields.comment, true),
  };
}

export const avatarExtension = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

const AVATAR_MIME = new Set<string>(Object.values(AVATAR_TYPES));

/**
 * First-line check, used by the form (fast feedback, before anything is uploaded) and by the upload endpoint.
 * The extension and the browser's reported type are only hints: the server re-checks the stored file's real
 * content (see avatar-store.server.ts).
 */
export function validateAvatar(file: { name: string; size: number; type?: string }): string | undefined {
  if (!(avatarExtension(file.name) in AVATAR_TYPES) || (file.type && !AVATAR_MIME.has(file.type))) return AVATAR_BAD_TYPE;
  if (file.size <= 0) return 'That image looks empty. Please choose another.';
  if (file.size > AVATAR_MAX_BYTES) return AVATAR_TOO_LARGE;
}
