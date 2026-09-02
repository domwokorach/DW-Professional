import LegalPage from "@/components/ui/LegalPage";

export const metadata = { title: "Privacy Policy | Dominic Wokorach" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This portfolio does not use tracking cookies or third-party
        analytics. Information submitted through the contact form is only
        used to respond to your enquiry and is sent directly via email — it
        is not stored on any server.
      </p>
      <p>
        If you have questions about how your information is handled, please
        get in touch via the contact section.
      </p>
    </LegalPage>
  );
}
