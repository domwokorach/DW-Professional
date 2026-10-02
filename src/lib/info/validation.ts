import { z } from "zod";
import { MESSAGE_MAX_CHARS, countCharacters } from "@/lib/contact/message";
import { ATTACHMENT_MIME_TYPES, ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPE_ERROR } from "@/lib/contact/attachments";

/**
 * Shared rules for the /info form (the page the QR code opens). Imported by
 * the client form for inline validation and by /api/info for authoritative
 * validation. The attachment rules are the contact form's, since both
 * forms use the same FileUploadField and Blob upload flow.
 */

export const INFO_PROJECT_TYPE_OPTIONS = [
  { value: "recruitment", label: "Recruitment" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "hr", label: "HR" },
  { value: "freelance", label: "Freelance" },
  { value: "other", label: "Other" },
] as const;

export type InfoProjectType = (typeof INFO_PROJECT_TYPE_OPTIONS)[number]["value"];

/** Submissions completed faster than this after the page loaded are treated as bots. */
export const INFO_MIN_FILL_MS = 2500;

/** Messages with more links than this are rejected as spam. */
export const INFO_MAX_MESSAGE_LINKS = 3;

const URL_MAX_CHARS = 500;

/** Adds "https://" when the visitor typed a bare domain like "github.com/name". */
export function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * Returns an error message for an optional URL field, or null when it's
 * empty or valid. `domain` restricts the host (e.g. LinkedIn URLs must be
 * on linkedin.com).
 */
export function validateUrlInput(raw: string, label: string, domain?: string): string | null {
  const value = normalizeUrlInput(raw);
  if (!value) return null;
  if (value.length > URL_MAX_CHARS) return `${label} is too long.`;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return `Enter a valid ${label}.`;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return `Enter a valid ${label}.`;
  if (!url.hostname.includes(".")) return `Enter a valid ${label}.`;
  if (domain && !hostMatches(url.hostname, domain)) return `${label} must be a ${domain} address.`;
  return null;
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : undefined));

const optionalUrl = (label: string, domain?: string) =>
  z
    .string()
    .nullish()
    .transform((v, ctx) => {
      const raw = (v ?? "").trim();
      if (!raw) return undefined;
      const error = validateUrlInput(raw, label, domain);
      if (error) {
        ctx.addIssue({ code: "custom", message: error });
        return z.NEVER;
      }
      return normalizeUrlInput(raw);
    });

export const infoFormSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your full name.").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    mobile: z.string().trim().min(1, "Enter your mobile number.").max(32),
    mobileCountry: z
      .string()
      .trim()
      .max(2)
      .nullish()
      .transform((v) => (v ? v.toUpperCase() : undefined)),
    company: z.string().trim().min(1, "Enter your company.").max(160),
    projectType: z
      .union([
        z.enum(INFO_PROJECT_TYPE_OPTIONS.map((o) => o.value) as [InfoProjectType, ...InfoProjectType[]]),
        z.literal(""),
      ])
      .nullish()
      .transform((v) => (v ? v : undefined)),
    linkedinUrl: optionalUrl("LinkedIn URL", "linkedin.com"),
    githubUrl: optionalUrl("GitHub URL", "github.com"),
    otherUrl: optionalUrl("URL"),
    message: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v ? v : undefined))
      .refine((v) => !v || countCharacters(v) <= MESSAGE_MAX_CHARS, {
        message: `Keep your message to ${MESSAGE_MAX_CHARS.toLocaleString()} characters or fewer.`,
      })
      .refine((v) => !v || countLinks(v) <= INFO_MAX_MESSAGE_LINKS, {
        message: `Please include no more than ${INFO_MAX_MESSAGE_LINKS} links in your message.`,
      }),
    attachmentUrl: optionalTrimmed(2048),
    attachmentName: optionalTrimmed(255),
    attachmentType: optionalTrimmed(200),
    attachmentSize: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v ? Number(v) : undefined))
      .refine((v) => v === undefined || (Number.isFinite(v) && v > 0 && v <= ATTACHMENT_MAX_BYTES), {
        message: "Invalid attachment size.",
      }),
    /** Client-generated per-submission id, reused on retry so a resend can't deliver the email twice. */
    submissionId: z.string().uuid("Invalid submission."),
  })
  .refine(
    (data) =>
      Boolean(data.attachmentUrl) === Boolean(data.attachmentName) &&
      Boolean(data.attachmentUrl) === Boolean(data.attachmentType) &&
      Boolean(data.attachmentUrl) === Boolean(data.attachmentSize),
    { message: "Incomplete attachment upload.", path: ["attachment"] }
  )
  .refine((data) => !data.attachmentType || ATTACHMENT_MIME_TYPES.includes(data.attachmentType), {
    message: ATTACHMENT_TYPE_ERROR,
    path: ["attachment"],
  });

export type InfoFormInput = z.infer<typeof infoFormSchema>;
