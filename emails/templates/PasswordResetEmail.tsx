import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface PasswordResetEmailProps {
  resetUrl: string;
  expiresInMinutes?: number;
}

export default function PasswordResetEmail({ resetUrl, expiresInMinutes = 60 }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your admin password" heading="Reset your password">
      <Text style={emailTextStyles.paragraph}>
        We received a request to reset the password for your admin account. Click the button below to
        choose a new one.
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

PasswordResetEmail.PreviewProps = {
  resetUrl: "https://example.com/auth/reset-password?token=preview",
  expiresInMinutes: 60,
} satisfies PasswordResetEmailProps;
