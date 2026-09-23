import type { CSSProperties } from "react";
import { Body, Button, Column, Container, Head, Heading, Hr, Html, Preview, Row, Section, Text } from "@react-email/components";

const BRAND_NAME = "Dominic Wokorach";

export interface ChatWaitingEmailProps {
  candidateName: string;
  candidateEmail?: string | null;
  conversationId: string;
  messagePreview: string;
  /** Pre-formatted, e.g. "22 Sep 2026, 11:32 BST" — formatting stays in the caller. */
  receivedAt: string;
  /** Pre-formatted, e.g. "6 minutes" — formatting stays in the caller. */
  waitingFor: string;
  adminChatUrl: string;
  /** Reminder copy differs slightly from the first alert; dedup itself lives in the caller. */
  isReminder: boolean;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row style={styles.infoRow}>
      <Column style={styles.infoLabelCol}>
        <Text style={styles.infoLabel}>{label}</Text>
      </Column>
      <Column style={styles.infoValueCol}>
        <Text style={styles.infoValue}>{value}</Text>
      </Column>
    </Row>
  );
}

export default function ChatWaitingEmail({
  candidateName,
  candidateEmail,
  conversationId,
  messagePreview,
  receivedAt,
  waitingFor,
  adminChatUrl,
  isReminder,
}: ChatWaitingEmailProps) {
  const previewText = isReminder
    ? `Still waiting: ${candidateName} in Live Chat`
    : `New candidate waiting in Live Chat`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.content}>
            <Heading style={styles.heading}>
              {isReminder ? "Still waiting for a reply" : "New candidate waiting in Live Chat"}
            </Heading>
            <Text style={styles.intro}>
              {isReminder
                ? `${candidateName} has been waiting ${waitingFor} for a reply in Live Chat.`
                : `${candidateName} started a conversation in Live Chat and hasn't had a reply yet (waiting ${waitingFor}).`}
            </Text>

            <Section style={styles.card}>
              <InfoRow label="Candidate" value={candidateName} />
              <InfoRow label="Email" value={candidateEmail || "Not provided"} />
              <InfoRow label="Conversation" value={conversationId} />
              <InfoRow label="Received" value={receivedAt} />
              <InfoRow label="Waiting" value={waitingFor} />
            </Section>

            <Heading as="h2" style={styles.subheading}>
              Message
            </Heading>
            <Section style={styles.messageCard}>
              <Text style={styles.messageText}>{messagePreview}</Text>
            </Section>

            <Section style={styles.buttonWrap}>
              <Button href={adminChatUrl} style={styles.button}>
                Open Admin Chat
              </Button>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              {isReminder
                ? "This is the only reminder for this conversation — you won't be emailed again until the candidate sends a new message after your reply."
                : "You'll get one reminder if there's still no reply after a few minutes."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ChatWaitingEmail.PreviewProps = {
  candidateName: "Amara Chen",
  candidateEmail: "amara.chen@example.com",
  conversationId: "conv_abc123",
  messagePreview: "Hi Dominic, I wanted to ask about your availability for a short contract next month.",
  receivedAt: "22 Sep 2026, 11:32 BST",
  waitingFor: "6 minutes",
  adminChatUrl: `https://${BRAND_NAME}/admin/chat?conversation=conv_abc123`,
  isReminder: false,
} satisfies ChatWaitingEmailProps;

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: "32px 16px",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    overflow: "hidden",
  },
  content: { padding: "32px 40px 8px" },
  heading: { fontSize: "22px", lineHeight: "28px", fontWeight: 700, color: "#18181b", margin: "0 0 8px" },
  intro: { fontSize: "14px", lineHeight: "22px", color: "#71717a", margin: "0 0 24px" },
  subheading: { fontSize: "13px", lineHeight: "18px", fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", margin: "24px 0 10px" },
  card: {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "10px",
    padding: "6px 20px",
    margin: 0,
  },
  infoRow: { borderBottom: "1px solid #ececef" },
  infoLabelCol: { width: "120px", verticalAlign: "top", padding: "10px 0" },
  infoLabel: { fontSize: "13px", lineHeight: "20px", color: "#a1a1aa", margin: 0 },
  infoValueCol: { verticalAlign: "top", padding: "10px 0" },
  infoValue: { fontSize: "14px", lineHeight: "20px", color: "#18181b", fontWeight: 500, margin: 0, wordBreak: "break-word" },
  messageCard: {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "10px",
    padding: "18px 20px",
    margin: 0,
  },
  messageText: { fontSize: "15px", lineHeight: "24px", color: "#3f3f46", margin: 0, whiteSpace: "pre-wrap" },
  buttonWrap: { textAlign: "center", margin: "28px 0 8px" },
  button: {
    display: "inline-block",
    backgroundColor: "#111111",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 32px",
    borderRadius: "999px",
    textDecoration: "none",
  },
  hr: { borderColor: "#e4e4e7", margin: "12px 0" },
  footer: { padding: "0 40px 32px" },
  footerText: { fontSize: "12px", lineHeight: "18px", color: "#a1a1aa", margin: 0 },
};
