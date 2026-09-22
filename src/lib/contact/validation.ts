import { z } from "zod";
import { MESSAGE_MAX_WORDS, countWords } from "@/lib/contact/words";

export const BUDGET_CURRENCIES = [
  { value: "GBP", label: "£ GBP", symbol: "£" },
  { value: "USD", label: "$ USD", symbol: "$" },
  { value: "EUR", label: "€ EUR", symbol: "€" },
  { value: "OTHER", label: "Other / Custom", symbol: "" },
] as const;

export type BudgetCurrency = (typeof BUDGET_CURRENCIES)[number]["value"];

// Up to 2 decimal places, no leading zeros beyond a single "0", no negative
// sign accepted at all.
const BUDGET_AMOUNT_PATTERN = /^\d{1,15}(\.\d{1,2})?$/;

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
    company: optionalTrimmed(160),
    companyNumber: optionalTrimmed(20),
    budgetAmount: z
      .string()
      .trim()
      .nullish()
      .transform((v) => (v ? v : undefined))
      .refine((v) => v === undefined || BUDGET_AMOUNT_PATTERN.test(v), {
        message: "Enter a valid amount (numbers only, no negative values).",
      }),
    budgetCurrency: z
      .enum(["GBP", "USD", "EUR", "OTHER", ""])
      .nullish()
      .transform((v) => (v ? v : undefined)),
    budgetCurrencyOther: optionalTrimmed(12),
    projectType: optionalTrimmed(80),
    message: z
      .string()
      .trim()
      .min(1, "Enter a message.")
      .max(20000, "Message is too long.")
      .refine((v) => countWords(v) <= MESSAGE_MAX_WORDS, {
        message: `Keep your message under ${MESSAGE_MAX_WORDS.toLocaleString()} words.`,
      }),
  })
  .refine((data) => !data.budgetAmount || data.budgetCurrency, {
    message: "Choose a currency for your budget.",
    path: ["budgetCurrency"],
  })
  .refine((data) => data.budgetCurrency !== "OTHER" || Boolean(data.budgetCurrencyOther), {
    message: "Enter your currency (e.g. JPY, AUD).",
    path: ["budgetCurrencyOther"],
  });

export type ContactFormInput = z.infer<typeof contactFormSchema>;
