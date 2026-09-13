import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface ForgotPasswordEmailProps {
  resetUrl: string;
  expiresInMinutes?: number;
  name?: string | null;
}

export default function ForgotPasswordEmail({ resetUrl, expiresInMinutes = 60, name }: ForgotPasswordEmailProps) {
  return (
    <EmailLayout preview="Reset your password" heading="Reset your password">
      <Text style={emailTextStyles.paragraph}>
        {name ? `Hi ${name},` : "Hi,"} we received a request to reset the password for your admin account.
        Click the button below to choose a new one.
      </Text>
      <div style={emailTextStyles.buttonWrap}>
        <a href={resetUrl} style={emailTextStyles.button}>
          Reset password
        </a>
      </div>
      <Text style={emailTextStyles.linkFallback}>
        Or paste this link into your browser: {resetUrl}
      </Text>
      <Text style={emailTextStyles.small}>This link expires in {expiresInMinutes} minutes and can only be used once.</Text>
      <Text style={emailTextStyles.small}>
        If you didn&rsquo;t request this, you can safely ignore this email &mdash; your password will not change.
      </Text>
    </EmailLayout>
  );
}

ForgotPasswordEmail.PreviewProps = {
  resetUrl: "https://example.com/auth/reset-password?token=preview",
  expiresInMinutes: 60,
  name: "Dominic",
} satisfies ForgotPasswordEmailProps;
