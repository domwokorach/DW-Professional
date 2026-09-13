import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(255);
export const passwordSchema = z.string().min(1).max(256);

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(256)
  .refine((v) => /[a-z]/.test(v), "Include a lowercase letter.")
  .refine((v) => /[A-Z]/.test(v), "Include an uppercase letter.")
  .refine((v) => /[0-9]/.test(v), "Include a number.")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Include a symbol.");

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: newPasswordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: newPasswordSchema,
});

export const changeEmailSchema = z.object({
  currentPassword: passwordSchema,
  newEmail: emailSchema,
});

export const verifyEmailChangeSchema = z.object({
  token: z.string().min(1),
});

export const revokeSessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timeZone: z.string().min(1).max(64).optional(),
  availability: z.enum(["ONLINE", "AWAY", "BUSY", "OFFLINE"]).optional(),
  notifications: z
    .object({
      newMessage: z.boolean().optional(),
      sound: z.boolean().optional(),
      browserPush: z.boolean().optional(),
    })
    .partial()
    .optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
