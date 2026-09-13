import { z } from "zod";

export const COMMENT_BODY_MAX_LENGTH = 600;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const submitCommentSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  company: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined)),
  body: z
    .string()
    .trim()
    .min(1, "Comment is required.")
    .max(COMMENT_BODY_MAX_LENGTH, `Keep it under ${COMMENT_BODY_MAX_LENGTH} characters.`),
});

export const moderateCommentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
