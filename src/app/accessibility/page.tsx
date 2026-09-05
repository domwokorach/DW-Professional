import Link from "next/link";
import LegalPage from "@/components/ui/LegalPage";

export const metadata = { title: "Accessibility | Dominic Wokorach" };

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility">
      <section aria-labelledby="accessibility-commitment">
        <h2 id="accessibility-commitment" className="text-base font-semibold text-white">
          Our commitment
        </h2>
        <p className="mt-2">
          This portfolio aims to meet the Web Content Accessibility Guidelines
          (WCAG) 2.2 Level AA. It is designed to be usable by people using
          keyboards, screen readers, mobile devices, and other assistive
          technologies.
        </p>
      </section>

      <section aria-labelledby="accessibility-support">
        <h2 id="accessibility-support" className="text-base font-semibold text-white">
          How this site supports access
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Pages use semantic landmarks, clear heading order, and descriptive
            links to help people navigate with assistive technology.
          </li>
          <li>
            Interactive controls can be operated with a keyboard and show a
            visible focus indicator.
          </li>
          <li>
            Text and controls are designed with readable contrast, responsive
            layouts, and touch-friendly target sizes.
          </li>
          <li>
            Motion is reduced when your device or browser preference requests
            it.
          </li>
          <li>
            Forms provide visible labels and communicate validation, loading,
            success, and error states in more than colour alone.
          </li>
        </ul>
      </section>

      <section aria-labelledby="accessibility-preferences">
        <h2 id="accessibility-preferences" className="text-base font-semibold text-white">
          Display preferences
        </h2>
        <p className="mt-2">
          Select <strong>Accessibility options</strong> in the lower-left corner
          of any page to turn on high contrast, adjust text size, use bolder
          text, or reset your preferences. Your choices are saved on this
          device and apply across the website.
        </p>
      </section>

      <section aria-labelledby="accessibility-feedback">
        <h2 id="accessibility-feedback" className="text-base font-semibold text-white">
          Accessibility feedback
        </h2>
        <p className="mt-2">
          If you encounter an accessibility barrier or need information in a
          different format, please{" "}
          <Link href="/#contact" className="font-medium text-accent hover:text-white">
            contact Dominic
          </Link>
          . Please include the page you were using and a brief description of
          the issue so it can be addressed.
        </p>
      </section>
    </LegalPage>
  );
}
