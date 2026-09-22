import { z } from "zod";
import { MESSAGE_MAX_CHARS, countCharacters } from "@/lib/contact/message";
import { ATTACHMENT_MIME_TYPES, ATTACHMENT_MAX_BYTES } from "@/lib/contact/attachments";

export const BUDGET_OPTIONS = [
  { value: "not_sure", label: "Not sure yet" },
  { value: "under_1000", label: "Under £1,000" },
  { value: "1000_5000", label: "£1,000–£5,000" },
  { value: "5000_10000", label: "£5,000–£10,000" },
  { value: "10000_25000", label: "£10,000–£25,000" },
  { value: "25000_plus", label: "£25,000+" },
] as const;

export type BudgetOption = (typeof BUDGET_OPTIONS)[number]["value"];

export const PROJECT_TYPE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "web_application", label: "Web application" },
  { value: "mobile_application", label: "Mobile application" },
  { value: "ui_ux_design", label: "UI/UX design" },
  { value: "api_backend", label: "API or backend development" },
  { value: "ai_integration", label: "AI integration" },
  { value: "maintenance_support", label: "Maintenance and support" },
  { value: "other", label: "Other" },
] as const;

export type ProjectTypeOption = (typeof PROJECT_TYPE_OPTIONS)[number]["value"];

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : undefined));

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    mobile: optionalTrimmed(32),
    mobileCountry: z
      .string()
      .trim()
      .max(2)
      .nullish()
      .transform((v) => (v ? v.toUpperCase() : undefined)),
    company: optionalTrimmed(160),
    companyNumber: optionalTrimmed(20),
    budget: z
      .union([z.enum(BUDGET_OPTIONS.map((o) => o.value) as [BudgetOption, ...BudgetOption[]]), z.literal("")])
      .nullish()
      .transform((v) => (v ? v : undefined)),
    projectType: z
      .union([
        z.enum(PROJECT_TYPE_OPTIONS.map((o) => o.value) as [ProjectTypeOption, ...ProjectTypeOption[]]),
        z.literal(""),
      ])
      .nullish()
      .transform((v) => (v ? v : undefined)),
    message: z
      .string()
      .trim()
      .min(1, "Message is required")
      .refine((v) => countCharacters(v) <= MESSAGE_MAX_CHARS, {
        message: `Keep your message to ${MESSAGE_MAX_CHARS.toLocaleString()} characters or fewer.`,
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
  })
  .refine(
    (data) =>
      Boolean(data.attachmentUrl) === Boolean(data.attachmentName) &&
      Boolean(data.attachmentUrl) === Boolean(data.attachmentType) &&
      Boolean(data.attachmentUrl) === Boolean(data.attachmentSize),
    { message: "Incomplete attachment upload.", path: ["attachment"] }
  )
  .refine((data) => !data.attachmentType || ATTACHMENT_MIME_TYPES.includes(data.attachmentType), {
    message: "File must be PDF, DOCX, PNG, JPG, or JPEG.",
    path: ["attachment"],
  });

export type ContactFormInput = z.infer<typeof contactFormSchema>;
