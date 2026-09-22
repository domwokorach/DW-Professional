import Container from "@/components/ui/Container";
import PortraitAnimator from "@/components/animate/PortraitAnimator";

export const metadata = { title: "Animate a portrait | Dominic Wokorach" };

export default function AnimatePage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-semibold text-paper sm:text-3xl">Animate a portrait</h1>
        <p className="mt-3 text-muted">
          Upload a headshot and get back a short, cinematic clip of subtle, natural motion — blinking,
          gentle expressions, a small head tilt — with the background kept completely still.
        </p>
      </div>
      <div className="mt-10">
        <PortraitAnimator />
      </div>
    </Container>
  );
}
