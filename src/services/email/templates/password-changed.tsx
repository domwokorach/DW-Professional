import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface PasswordChangedEmailProps {
  occurredAt: string;
  ipAddress?: string;
}

export default function PasswordChangedEmail({ occurredAt, ipAddress }: PasswordChangedEmailProps) {
  return (
    <EmailLayout preview="Your password was changed" heading="Your password was changed">
      <Text style={emailTextStyles.paragraph}>
        This confirms your admin account password was changed on {occurredAt}
        {ipAddress ? ` from IP address ${ipAddress}` : ""}. All other sessions have been signed out.
      </Text>
      <Text style={emailTextStyles.small}>
        If you made this change, no further action is needed.
      </Text>
      <Text style={emailTextStyles.small}>
        If you didn&rsquo;t make this change, contact us immediately &mdash; your account may be compromised.
      </Text>
    </EmailLayout>
  );
}

PasswordChangedEmail.PreviewProps = {
  occurredAt: new Date().toLocaleString("en-GB"),
  ipAddress: "203.0.113.4",
} satisfies PasswordChangedEmailProps;
