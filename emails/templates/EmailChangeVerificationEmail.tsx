import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface EmailChangeVerificationEmailProps {
  verifyUrl: string;
  newEmail: string;
  expiresInMinutes?: number;
}

export default function EmailChangeVerificationEmail({
  verifyUrl,
  newEmail,
  expiresInMinutes = 60,
}: EmailChangeVerificationEmailProps) {
  return (
    <EmailLayout preview="Confirm your new email address" heading="Confirm your new email address">
      <Text style={emailTextStyles.paragraph}>
        You requested to change your admin account&rsquo;s email address to <strong>{newEmail}</strong>.
        Confirm this address to complete the change.
      </Text>
      <div style={emailTextStyles.buttonWrap}>
        <a href={verifyUrl} style={emailTextStyles.button}>
          Confirm email address
        </a>
      </div>
      <Text style={emailTextStyles.linkFallback}>Or paste this link into your browser: {verifyUrl}</Text>
      <Text style={emailTextStyles.small}>This link expires in {expiresInMinutes} minutes.</Text>
      <Text style={emailTextStyles.small}>
        If you didn&rsquo;t request this change, you can ignore this email &mdash; your address will not change.
      </Text>
    </EmailLayout>
  );
}

EmailChangeVerificationEmail.PreviewProps = {
  verifyUrl: "https://example.com/api/auth/verify-email-change?token=preview",
  newEmail: "new@example.com",
  expiresInMinutes: 60,
} satisfies EmailChangeVerificationEmailProps;
