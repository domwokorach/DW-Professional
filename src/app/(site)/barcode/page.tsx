import Link from "next/link";
import Container from "@/components/ui/Container";
import ProjectProfileCard from "@/components/contact/ProjectProfileCard";
import { FontWeightText } from "@/components/ui/font-weight-text";

export const metadata = { title: "Barcode | Dominic Wokorach" };

const PROFILE_AVATAR_URL =
  "https://res.cloudinary.com/dkkuwmr42/image/upload/v1790089893/dominic_zw1v8s.png";

// Square crop of the "Scan me!" poster (MyQRCode_cogruq.png) down to just the
// QR code plus a white margin, scaled to 600px. It encodes a qrfy.io link
// that redirects to /en-gb/info.
const QR_CODE_URL =
  "https://res.cloudinary.com/dkkuwmr42/image/upload/c_crop,x_396,y_459,w_1022,h_1022/c_scale,w_600/v1790964030/MyQRCode_cogruq.png";

export default function BarcodePage() {
  return (
    <article className="relative isolate flex min-h-[100svh] items-center overflow-hidden py-32 sm:py-40">
      {/* Decorative backdrop: oversized, faint "Barcode Me" behind the card.
          Hidden from assistive tech (the h1 below already says it), ignores
          pointer events, and sits under the card so the QR code stays clean. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex select-none items-center justify-center"
      >
        <FontWeightText
          text="Barcode Me"
          minWeight={200}
          maxWeight={900}
          staticWeight={700}
          animationDuration={2.4}
          delayMultiplier={0.2}
          className="whitespace-nowrap text-center text-[15vw] leading-none tracking-tighter text-paper/[0.07] 2xl:text-[14rem]"
        />
      </div>

      <Container className="flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <Link href="/" className="text-sm text-muted hover:text-paper transition-colors">
            ← Back to Portfolio
          </Link>

          <div className="mt-10 flex flex-col items-center gap-6 sm:mt-12 sm:gap-8">
            <FontWeightText
              as="h1"
              text="Barcode Me"
              minWeight={300}
              maxWeight={800}
              staticWeight={650}
              animationDuration={1.5}
              delayMultiplier={0.15}
              className="text-center text-2xl tracking-tight text-paper sm:text-3xl"
            />
            <ProjectProfileCard
              avatarUrl={PROFILE_AVATAR_URL}
              miniAvatarUrl={PROFILE_AVATAR_URL}
              name="Dominic Wokorach"
              title="Full Stack Developer"
              handle="domwokorach"
              status="Available"
              showContactButton={false}
              centerImage={{ src: QR_CODE_URL, alt: "QR code: scan to share your information with Dominic" }}
              showUserInfo
              enableTilt
              enableMobileTilt={false}
              className="self-center"
            />
          </div>
        </div>
      </Container>
    </article>
  );
}
