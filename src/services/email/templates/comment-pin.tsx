import { Text } from "@react-email/components";
import { EmailLayout, emailTextStyles } from "./Layout";

export interface CommentPinEmailProps {
  pin: string;
  expiresInMinutes?: number;
  fullName?: string | null;
}

export default function CommentPinEmail({ pin, expiresInMinutes = 10, fullName }: CommentPinEmailProps) {
  return (
    <EmailLayout preview={`Your verification code is ${pin}`} heading="Confirm your comment">
      <Text style={emailTextStyles.paragraph}>
        {fullName ? `Hi ${fullName}, e` : "E"}nter this code to confirm the comment you submitted on
        dominicwokorach.me.
      </Text>
      <div style={emailTextStyles.infoCard}>
        <Text style={{ ...emailTextStyles.paragraph, margin: 0, fontSize: "28px", fontWeight: 700, letterSpacing: "6px", textAlign: "center" as const, color: "#18181b" }}>
          {pin}
        </Text>
      </div>
      <Text style={emailTextStyles.small}>This code expires in {expiresInMinutes} minutes.</Text>
      <Text style={emailTextStyles.small}>
        Don&rsquo;t share this code with anyone. Dominic Wokorach will never ask you for it.
      </Text>
      <Text style={emailTextStyles.small}>
        If you didn&rsquo;t try to leave a comment, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}

CommentPinEmail.PreviewProps = {
  pin: "482913",
  expiresInMinutes: 10,
} satisfies CommentPinEmailProps;
