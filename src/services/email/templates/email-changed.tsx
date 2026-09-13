import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface EmailChangedEmailProps {
  newEmail: string;
  occurredAt: string;
}

/** Sent to the OLD address so an account takeover via email change can't go unnoticed. */
export default function EmailChangedEmail({ newEmail, occurredAt }: EmailChangedEmailProps) {
  return (
    <EmailLayout preview="Your account email address was changed" heading="Your email address was changed">
      <Text style={emailTextStyles.paragraph}>
        The email address on your admin account was changed to <strong>{newEmail}</strong> on {occurredAt}.
        This address will no longer receive account notifications.
      </Text>
      <Text style={emailTextStyles.small}>
        If you didn&rsquo;t make this change, contact us immediately &mdash; your account may be compromised.
      </Text>
    </EmailLayout>
  );
}

EmailChangedEmail.PreviewProps = {
  newEmail: "new@example.com",
  occurredAt: new Date().toLocaleString("en-GB"),
} satisfies EmailChangedEmailProps;
