import type { CSSProperties, ReactNode } from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

const BRAND_NAME = "Dominic Wokorach";
const SUPPORT_EMAIL = "hello@dominicwokorach.me";

export function EmailLayout({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
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
            <Heading style={styles.heading}>{heading}</Heading>
            {children}
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

export const emailTextStyles = {
  paragraph: { fontSize: "15px", lineHeight: "24px", color: "#52525b", margin: "0 0 20px" } as CSSProperties,
  small: { fontSize: "13px", lineHeight: "20px", color: "#71717a", margin: "0 0 8px" } as CSSProperties,
  buttonWrap: { textAlign: "center" as const, margin: "8px 0 28px" },
  button: {
    display: "inline-block",
    backgroundColor: "#111111",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 28px",
    borderRadius: "999px",
    textDecoration: "none",
  } as CSSProperties,
  linkFallback: { fontSize: "12px", lineHeight: "18px", color: "#a1a1aa", wordBreak: "break-all" as const, margin: "0 0 20px" },
  infoCard: {
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "10px",
    padding: "16px 20px",
    margin: "0 0 20px",
  } as CSSProperties,
};

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  brandRow: { padding: "28px 40px 0" },
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
  brandName: { paddingLeft: "10px", fontSize: "14px", fontWeight: 600, color: "#3f3f46", verticalAlign: "middle" },
  content: { padding: "24px 40px 8px" },
  heading: { fontSize: "22px", lineHeight: "28px", fontWeight: 700, color: "#18181b", margin: "0 0 12px" },
  hr: { borderColor: "#e4e4e7", margin: "28px 0" },
  footer: { padding: "0 40px 32px" },
  footerText: { fontSize: "12px", lineHeight: "18px", color: "#a1a1aa", margin: "0 0 4px" },
  footerLink: { color: "#a1a1aa", textDecoration: "underline" },
};
