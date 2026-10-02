import Link from "next/link";
import Container from "@/components/ui/Container";
import ProjectProfileCard from "@/components/contact/ProjectProfileCard";

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
    <article className="flex min-h-[100svh] items-center py-32 sm:py-40">
      <Container className="flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <Link href="/" className="text-sm text-muted hover:text-paper transition-colors">
            ← Back to Portfolio
          </Link>

          <div className="mt-10 flex flex-col items-center gap-6 sm:mt-12 sm:gap-8">
            <h1 className="text-center text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
              Barcode Me
            </h1>
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
