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
