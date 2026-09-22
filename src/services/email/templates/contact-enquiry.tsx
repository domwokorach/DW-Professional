import type { CSSProperties } from "react";
import { Body, Button, Column, Container, Head, Heading, Hr, Html, Link, Preview, Row, Section, Text } from "@react-email/components";

const BRAND_NAME = "Dominic Wokorach";
const SITE_HOST = "dominicwokorach.me";
const SITE_URL = `https://${SITE_HOST}`;

export interface ContactEnquiryAttachment {
  /** Sanitised, display-safe filename (never the raw upload path). */
  filename: string;
  /** Human-readable file type, e.g. "PDF document" or "image/png". */
  type: string;
}

export interface ContactEnquiryEmailProps {
  name: string;
  /** Zod-validated visitor email — safe to use as the Reply-To / mailto target. */
  email: string;
  /** E.164 formatted mobile number, or null when not supplied. */
  mobile?: string | null;
  company?: string | null;
  /** Pre-formatted budget + currency, e.g. "£8,000" — formatting stays in the caller. */
  budgetLine?: string | null;
  projectType?: string | null;
  message: string;
  /** Pre-formatted submission date/time, e.g. "22 Sep 2026, 11:32 BST". */
  submittedAt: string;
  attachment?: ContactEnquiryAttachment | null;
}

/** Splits on newlines and inserts real <br/> elements so paragraph breaks survive — text nodes stay React-escaped throughout. */
function renderMultiline(text: string) {
  const lines = text.split("\n");
  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
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

export default function ContactEnquiryEmail({
  name,
  email,
  mobile,
  company,
  budgetLine,
  projectType,
  message,
  submittedAt,
  attachment,
}: ContactEnquiryEmailProps) {
  const previewText = `New enquiry from ${name}${company ? ` — ${company}` : ""}`;
  const firstName = name.trim().split(/\s+/)[0] || "them";
  const replyHref = `mailto:${email}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandRow}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "auto" }}>
              <tbody>
                <tr>
                  <td style={styles.logoMark}>DW</td>
                  <td style={styles.brandName}>{BRAND_NAME} Portfolio</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.content}>
            <Heading style={styles.heading}>New project enquiry</Heading>
            <Text style={styles.intro}>
              A visitor submitted the contact form on {SITE_HOST}. Details are below.
            </Text>

            <Section style={styles.card}>
              <InfoRow label="Name" value={name} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Mobile" value={mobile || "Not provided"} />
              <InfoRow label="Company" value={company || "Not provided"} />
              <InfoRow label="Budget" value={budgetLine || "Not provided"} />
              <InfoRow label="Project type" value={projectType || "Not provided"} />
              <InfoRow label="Submitted" value={submittedAt} />
            </Section>

            <Heading as="h2" style={styles.subheading}>
              Message
            </Heading>
            <Section style={styles.messageCard}>
              <Text style={styles.messageText}>{renderMultiline(message)}</Text>
            </Section>

            {attachment ? (
              <>
                <Heading as="h2" style={styles.subheading}>
                  Attachment
                </Heading>
                <Section style={styles.card}>
                  <Text style={styles.attachmentText}>
                    {attachment.filename} &middot; {attachment.type}
                  </Text>
                </Section>
              </>
            ) : null}

            <Section style={styles.buttonWrap}>
              <Button href={replyHref} style={styles.button}>
                Reply to {firstName}
              </Button>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This enquiry was submitted through the contact form on{" "}
              <Link href={SITE_URL} style={styles.footerLink}>
                {SITE_HOST}
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

ContactEnquiryEmail.PreviewProps = {
  name: "Amara Chen",
  email: "amara.chen@example.com",
  mobile: "+442071234567",
  company: "Northwind Studio",
  budgetLine: "£8,000",
  projectType: "Web Application",
  message:
    "Hi Dominic,\n\nWe're building an internal analytics dashboard and need a frontend engineer for around six weeks, starting next month.\n\nWould love to find 20 minutes this week if you have availability — let me know what works.\n\nThanks,\nAmara",
  submittedAt: "22 Sep 2026, 11:32 BST",
  attachment: { filename: "project-brief.pdf", type: "PDF document" },
} satisfies ContactEnquiryEmailProps;

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
  brandRow: { padding: "28px 40px 0" },
  logoMark: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#111111",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    textAlign: "center",
    verticalAlign: "middle",
    letterSpacing: "0.5px",
  },
  brandName: { paddingLeft: "10px", fontSize: "14px", fontWeight: 600, color: "#3f3f46", verticalAlign: "middle" },
  content: { padding: "24px 40px 8px" },
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
  attachmentText: { fontSize: "14px", lineHeight: "22px", color: "#18181b", margin: "10px 0" },
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
  footerLink: { color: "#a1a1aa", textDecoration: "underline" },
};
