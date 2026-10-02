import Link from "next/link";
import Container from "@/components/ui/Container";
import InfoForm from "@/components/info/InfoForm";

export const metadata = {
  title: "Your Information | Dominic Wokorach",
  description: "Share your details with Dominic Wokorach.",
  robots: { index: false },
};

/** Opened by the QR code (see /info-qr.svg). */
export default function InfoPage() {
  return (
    <article className="py-16 sm:py-24">
      <Container className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <Link href="/" className="text-sm text-muted hover:text-paper transition-colors">
            ← Back to Portfolio
          </Link>

          <h1 className="mt-10 text-center text-2xl font-semibold tracking-tight text-paper sm:mt-12 sm:text-3xl">
            Please provide your information below.
          </h1>

          <div className="mt-8 rounded-2xl border border-line bg-surface/40 p-5 sm:mt-10 sm:p-8">
            <InfoForm />
          </div>
        </div>
      </Container>
    </article>
  );
}
