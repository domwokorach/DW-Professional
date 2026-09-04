import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface VerificationEmailProps {
  /** The one-time verification PIN. Digits only. */
  pin: string;
  /** Optional recipient name for a light personal touch. */
  userName?: string;
  /** How long the PIN stays valid, in minutes. */
  expiresInMinutes?: number;
}

const BRAND_NAME = "Dominic Wokorach";
const SUPPORT_EMAIL = "hello@dominicwokorach.me";

function formatPin(pin: string): string {
  const digits = pin.replace(/\D/g, "");
  if (digits.length !== 6) return pin;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export default function VerificationEmail({
  pin = "482193",
  userName,
  expiresInMinutes = 10,
}: VerificationEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html lang="en">
      <Head />
      <Preview>Your verification code is {pin}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandRow}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "auto" }}>
              <tbody>
                <tr>
                  <td style={styles.logoMark}>DW</td>
                  <td style={styles.brandName}>{BRAND_NAME}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.content}>
            <Heading style={styles.heading}>Verify your email</Heading>
            <Text style={styles.paragraph}>
              {userName ? `Hi ${userName}, ` : "Hi, "}
              we received a request to verify this email address. Enter this
              code to continue:
            </Text>

            <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
              <tbody>
                <tr>
                  <td style={styles.pinCard}>
                    <Text style={styles.pinText}>{formatPin(pin)}</Text>
                  </td>
                </tr>
              </tbody>
            </table>

            <Text style={styles.expiry}>
              This code expires in {expiresInMinutes} minutes.
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.securityText}>
              Never share this verification code with anyone.
            </Text>
            <Text style={styles.securityText}>
              If you didn&rsquo;t request this email, you can safely ignore
              it &mdash; no further action is needed.
            </Text>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              &copy; {year} {BRAND_NAME}. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              Questions? Contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} style={styles.footerLink}>
                {SUPPORT_EMAIL}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

VerificationEmail.PreviewProps = {
  pin: "482193",
  expiresInMinutes: 10,
} satisfies VerificationEmailProps;

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const monoStack =
  '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace';

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: fontStack,
    margin: 0,
    padding: "32px 16px",
  },
  container: {
    maxWidth: "580px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "12px",
    overflow: "hidden",
  },
  brandRow: {
    padding: "28px 40px 0",
  },
  logoMark: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#111111",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    textAlign: "center" as const,
    verticalAlign: "middle",
    letterSpacing: "0.5px",
  },
  brandName: {
    paddingLeft: "10px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#3f3f46",
    verticalAlign: "middle",
  },
  content: {
    padding: "24px 40px 8px",
  },
  heading: {
    fontSize: "22px",
    lineHeight: "28px",
    fontWeight: 700,
    color: "#18181b",
    margin: "0 0 12px",
  },
  paragraph: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "#52525b",
    margin: "0 0 28px",
  },
  pinCard: {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "10px",
    padding: "24px 16px",
    textAlign: "center" as const,
  },
  pinText: {
    fontFamily: monoStack,
    fontSize: "40px",
    fontWeight: 700,
    // textIndent compensates for the trailing letter-space on the last
    // digit so the PIN stays optically centered.
    letterSpacing: "8px",
    textIndent: "8px",
    color: "#18181b",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  expiry: {
    fontSize: "14px",
    lineHeight: "20px",
    color: "#71717a",
    textAlign: "center" as const,
    margin: "16px 0 0",
  },
  hr: {
    borderColor: "#e4e4e7",
    margin: "28px 0",
  },
  securityText: {
    fontSize: "13px",
    lineHeight: "20px",
    color: "#71717a",
    margin: "0 0 8px",
  },
  footer: {
    padding: "0 40px 32px",
  },
  footerText: {
    fontSize: "12px",
    lineHeight: "18px",
    color: "#a1a1aa",
    margin: "0 0 4px",
  },
  footerLink: {
    color: "#a1a1aa",
    textDecoration: "underline",
  },
};
