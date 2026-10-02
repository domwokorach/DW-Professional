import Link from "next/link";
import Container from "@/components/ui/Container";
import ProjectProfileCard from "@/components/contact/ProjectProfileCard";

export const metadata = { title: "Barcode | Dominic Wokorach" };

const PROFILE_AVATAR_URL =
  "https://res.cloudinary.com/dkkuwmr42/image/upload/v1790089893/dominic_zw1v8s.png";

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
