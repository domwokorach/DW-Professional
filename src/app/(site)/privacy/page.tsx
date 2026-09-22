import LegalPage from "@/components/ui/LegalPage";

export const metadata = { title: "Privacy Policy | Dominic Wokorach" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This portfolio does not use tracking cookies or third-party
        analytics. Information submitted through the contact form — including
        your name, email address, optional mobile number, company and
        message — is only used to respond to your enquiry and is sent
        directly via email. It is not stored on any server, database or
        analytics platform, and is never included in logs or URLs.
      </p>
      <p>
        If you have questions about how your information is handled, please
        get in touch via the contact section.
      </p>
    </LegalPage>
  );
}
