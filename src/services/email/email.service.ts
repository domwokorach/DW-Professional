import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { resendProvider } from "./resend.provider";
import type { EmailProvider, SendEmailResult } from "./types";
import ForgotPasswordEmail from "./templates/forgot-password";
import PasswordChangedEmail from "./templates/password-changed";
import EmailChangeVerificationEmail from "./templates/verify-email-change";
import EmailChangedEmail from "./templates/email-changed";
import NewDeviceSignInEmail from "./templates/new-device";
import SecurityAlertEmail from "./templates/security-alert";
import CommentPinEmail from "./templates/comment-pin";

const provider: EmailProvider = resendProvider;

async function sendTemplate(to: string, subject: string, template: ReactElement): Promise<SendEmailResult> {
  const [html, text] = await Promise.all([render(template), render(template, { plainText: true })]);
  return provider.send({ to, subject, html, text });
}

export function sendForgotPasswordEmail(params: {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<SendEmailResult> {
  const { to, name, resetUrl, expiresInMinutes } = params;
  return sendTemplate(to, "Reset your password", ForgotPasswordEmail({ resetUrl, expiresInMinutes, name }));
}

export function sendPasswordChangedEmail(params: {
  to: string;
  occurredAt: string;
  ipAddress?: string;
}): Promise<SendEmailResult> {
  const { to, occurredAt, ipAddress } = params;
  return sendTemplate(to, "Your password was changed", PasswordChangedEmail({ occurredAt, ipAddress }));
}

export function sendEmailChangeVerificationEmail(params: {
  to: string;
  newEmail: string;
  verifyUrl: string;
  expiresInMinutes: number;
}): Promise<SendEmailResult> {
  const { to, newEmail, verifyUrl, expiresInMinutes } = params;
  return sendTemplate(
    to,
    "Confirm your new email address",
    EmailChangeVerificationEmail({ verifyUrl, newEmail, expiresInMinutes })
  );
}

export function sendEmailChangedEmail(params: {
  to: string;
  newEmail: string;
  occurredAt: string;
}): Promise<SendEmailResult> {
  const { to, newEmail, occurredAt } = params;
  return sendTemplate(to, "Your account email address was changed", EmailChangedEmail({ newEmail, occurredAt }));
}

export function sendNewDeviceSignInEmail(params: {
  to: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress?: string;
  occurredAt: string;
  devicesUrl: string;
}): Promise<SendEmailResult> {
  const { to, ...template } = params;
  return sendTemplate(to, "New sign-in to your account", NewDeviceSignInEmail(template));
}

/**
 * Unlike the fire-and-forget notification emails above (password reset,
 * new-device alert, etc.), this one gates a user-visible step — the caller
 * shows "check your email" only after this resolves, so a provider failure
 * must surface as a thrown error rather than a swallowed `{ ok: false }`,
 * or the UI would claim a code was sent when it wasn't.
 */
export async function sendCommentPinEmail(params: {
  to: string;
  pin: string;
  expiresInMinutes: number;
  fullName?: string | null;
}): Promise<SendEmailResult> {
  const { to, pin, expiresInMinutes, fullName } = params;
  const result = await sendTemplate(to, "Confirm your comment", CommentPinEmail({ pin, expiresInMinutes, fullName }));
  if (!result.ok) {
    throw new Error(`Failed to send comment verification email: ${result.error ?? "unknown error"}`);
  }
  return result;
}

export function sendSecurityAlertEmail(params: {
  to: string;
  title: string;
  message: string;
  occurredAt: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<SendEmailResult> {
  const { to, ...template } = params;
  return sendTemplate(to, params.title, SecurityAlertEmail(template));
}
