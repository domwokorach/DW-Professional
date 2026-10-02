import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import {
  BRAND_NAME,
  InfoRow,
  SITE_HOST,
  SITE_URL,
  renderMultiline,
  styles,
  type ContactEnquiryAttachment,
} from "./contact-enquiry";

export interface InfoEnquiryEmailProps {
  fullName: string;
  /** Zod-validated visitor email — safe to use as the Reply-To / mailto target. */
  email: string;
  /** E.164 formatted mobile number. */
  mobile: string;
  company: string;
  projectType?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  otherUrl?: string | null;
  message?: string | null;
  /** Pre-formatted submission date/time, e.g. "2 Oct 2026, 18:40". */
  submittedAt: string;
  attachment?: ContactEnquiryAttachment | null;
}

function LinkRow({ label, href }: { label: string; href?: string | null }) {
  return <InfoRow label={label} value={href || "Not provided"} />;
}

/**
 * Sent to Dominic when someone submits the /info form (the page the QR code
 * opens). Shares its layout and styles with the contact enquiry email.
 */
export default function InfoEnquiryEmail({
  fullName,
  email,
  mobile,
  company,
  projectType,
  linkedinUrl,
  githubUrl,
  otherUrl,
  message,
  submittedAt,
  attachment,
}: InfoEnquiryEmailProps) {
  const firstName = fullName.trim().split(/\s+/)[0] || "them";

  return (
    <Html lang="en">
      <Head />
      <Preview>{`New QR code enquiry from ${fullName} — ${company}`}</Preview>
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
            <Heading style={styles.heading}>New information submission</Heading>
            <Text style={styles.intro}>
              Someone scanned your QR code and submitted the information form on {SITE_HOST}/info.
            </Text>

            <Section style={styles.card}>
              <InfoRow label="Full name" value={fullName} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Mobile" value={mobile} />
              <InfoRow label="Company" value={company} />
              <InfoRow label="Project type" value={projectType || "Not provided"} />
              <LinkRow label="LinkedIn" href={linkedinUrl} />
              <LinkRow label="GitHub" href={githubUrl} />
              <LinkRow label="Other URL" href={otherUrl} />
              <InfoRow label="Submitted" value={submittedAt} />
            </Section>

            <Heading as="h2" style={styles.subheading}>
              Message
            </Heading>
            <Section style={styles.messageCard}>
              <Text style={styles.messageText}>{message ? renderMultiline(message) : "No message provided."}</Text>
            </Section>

            {attachment ? (
              <>
                <Heading as="h2" style={styles.subheading}>
                  Attachment
                </Heading>
                <Section style={styles.card}>
                  <Text style={styles.attachmentText}>
                    {attachment.filename} &middot; {attachment.type} &middot; {attachment.size} (attached to this email)
                  </Text>
                </Section>
              </>
            ) : null}

            <Section style={styles.buttonWrap}>
              <Button href={`mailto:${email}`} style={styles.button}>
                Reply to {firstName}
              </Button>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This submission came from the information form on{" "}
              <Link href={`${SITE_URL}/info`} style={styles.footerLink}>
                {SITE_HOST}/info
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

InfoEnquiryEmail.PreviewProps = {
  fullName: "Amara Chen",
  email: "amara.chen@example.com",
  mobile: "+447700900123",
  company: "Northwind Talent",
  projectType: "Recruitment",
  linkedinUrl: "https://www.linkedin.com/in/amara-chen",
  githubUrl: null,
  otherUrl: "https://northwind.example.com",
  message: "Hi Dominic,\n\nGreat to meet you at the event today. I'd love to talk about a frontend role we're hiring for.\n\nAmara",
  submittedAt: "2 Oct 2026, 18:40",
  attachment: { filename: "role-description.pdf", type: "application/pdf", size: "212 KB" },
} satisfies InfoEnquiryEmailProps;
