import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import GallerySlider from "@/components/gallery/GallerySlider";
import { galleryCollections } from "@/data/gallery";

export default function Gallery() {
  return (
    <section id="gallery" className="relative scroll-mt-24 border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading index="06" label="Gallery" heading="Gallery" />

        <MotionReveal delay={0.1} className="mt-8 max-w-2xl">
          <p className="text-base leading-[1.7] text-muted">
            Selected moments from my professional journey, engineering career
            and community experiences.
          </p>
        </MotionReveal>

        <MotionReveal delay={0.15} className="mt-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {galleryCollections.map((c) => c.year).join(" → ")}
          </p>
        </MotionReveal>

        <div className="mt-12 space-y-16">
          {galleryCollections.map((collection) => (
            <GallerySlider key={collection.id} collection={collection} />
          ))}
        </div>
      </Container>
    </section>
  );
}
