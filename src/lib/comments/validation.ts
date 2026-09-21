import { z } from "zod";

export const COMMENT_BODY_MAX_LENGTH = 600;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : undefined));

const commentFieldsSchema = {
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  company: optionalTrimmed(160),
  body: z
    .string()
    .trim()
    .min(1, "Comment is required.")
    .max(COMMENT_BODY_MAX_LENGTH, `Keep it under ${COMMENT_BODY_MAX_LENGTH} characters.`),
};

/**
 * Metadata for a company the visitor picked from the search dropdown. This
 * is echoed back by the client, not re-verified against the provider — it's
 * display-only enrichment for a testimonial, not a security- or
 * billing-relevant fact, so structural validation (bounded length, URL
 * shape for the logo) is the right amount of trust to place in it.
 */
const companyMetaFieldsSchema = {
  companyId: optionalTrimmed(120),
  companyNumber: optionalTrimmed(20),
  companyStatus: optionalTrimmed(40),
  companySource: z
    .enum(["companies-house", "manual", ""])
    .nullish()
    .transform((v) => (v ? v : undefined)),
  companyDomain: optionalTrimmed(253),
  companyLogo: z
    .string()
    .trim()
    .max(2048)
    .url("Logo must be a valid URL.")
    .nullish()
    .transform((v) => (v ? v : undefined)),
  companyIndustry: optionalTrimmed(160),
  companyLocation: optionalTrimmed(200),
};

export const submitCommentSchema = z.object(commentFieldsSchema);

/** Step 1: submit the comment plus contact details, which triggers a PIN by email. */
export const sendCommentPinSchema = z.object({
  ...commentFieldsSchema,
  ...companyMetaFieldsSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
});

/** Step 2: confirm the PIN sent to the submitter's email. */
export const verifyCommentPinSchema = z.object({
  requestId: z.string().min(1, "Missing request id."),
  pin: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit code.")
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

/** Resend: re-issue a fresh PIN for an existing, still-open verification request. */
export const resendCommentPinSchema = z.object({
  requestId: z.string().min(1, "Missing request id."),
});

export const moderateCommentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
