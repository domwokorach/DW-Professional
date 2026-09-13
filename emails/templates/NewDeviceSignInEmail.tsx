import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface NewDeviceSignInEmailProps {
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress?: string;
  occurredAt: string;
  devicesUrl: string;
}

export default function NewDeviceSignInEmail({
  deviceName,
  browser,
  operatingSystem,
  ipAddress,
  occurredAt,
  devicesUrl,
}: NewDeviceSignInEmailProps) {
  return (
    <EmailLayout preview="New sign-in to your admin account" heading="New sign-in detected">
      <Text style={emailTextStyles.paragraph}>
        Your admin account was just signed in to from a new device on {occurredAt}.
      </Text>
      <div style={emailTextStyles.infoCard}>
        <Text style={{ ...emailTextStyles.small, margin: 0 }}>Device: {deviceName}</Text>
        <Text style={{ ...emailTextStyles.small, margin: 0 }}>
          {operatingSystem} &middot; {browser}
        </Text>
        {ipAddress ? <Text style={{ ...emailTextStyles.small, margin: 0 }}>IP address: {ipAddress}</Text> : null}
      </div>
      <div style={emailTextStyles.buttonWrap}>
        <a href={devicesUrl} style={emailTextStyles.button}>
          Review devices
        </a>
      </div>
      <Text style={emailTextStyles.small}>
        If this was you, no action is needed. If you don&rsquo;t recognise this activity, sign in and revoke the
        session from Devices, then change your password immediately.
      </Text>
    </EmailLayout>
  );
}

NewDeviceSignInEmail.PreviewProps = {
  deviceName: "Google Pixel 9",
  browser: "Chrome",
  operatingSystem: "Android 15",
  ipAddress: "203.0.113.4",
  occurredAt: new Date().toLocaleString("en-GB"),
  devicesUrl: "https://example.com/admin/devices",
} satisfies NewDeviceSignInEmailProps;
