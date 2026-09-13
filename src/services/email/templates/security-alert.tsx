import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface SecurityAlertEmailProps {
  title: string;
  message: string;
  occurredAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

/** Generic security-notification template — used for session revocations, lockouts, and similar alerts. */
export default function SecurityAlertEmail({
  title,
  message,
  occurredAt,
  actionUrl,
  actionLabel,
}: SecurityAlertEmailProps) {
  return (
    <EmailLayout preview={title} heading={title}>
      <Text style={emailTextStyles.paragraph}>{message}</Text>
      <Text style={emailTextStyles.small}>Occurred: {occurredAt}</Text>
      {actionUrl && actionLabel ? (
        <div style={emailTextStyles.buttonWrap}>
          <a href={actionUrl} style={emailTextStyles.button}>
            {actionLabel}
          </a>
        </div>
      ) : null}
    </EmailLayout>
  );
}

SecurityAlertEmail.PreviewProps = {
  title: "All other sessions were signed out",
  message: "You signed out all other devices from your admin account.",
  occurredAt: new Date().toLocaleString("en-GB"),
  actionUrl: "https://example.com/admin/devices",
  actionLabel: "Review devices",
} satisfies SecurityAlertEmailProps;
