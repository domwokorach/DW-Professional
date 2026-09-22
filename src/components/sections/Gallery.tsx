import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import AccordionGallery from "@/components/gallery/AccordionGallery";
import { galleryItems } from "@/data/gallery";

export default function Gallery() {
  return (
    <section id="gallery" className="gallery-section relative scroll-mt-[4.0625rem] border-t border-line">
      <Container className="gallery-section__inner">
        <div className="gallery-section__intro">
          <SectionHeading
            index="06"
            label="Gallery"
            heading="Gallery"
            animateHeading
            headingEffect="typing"
            typingSpeed={32}
          />

          <MotionReveal delay={0.1} className="mt-4 max-w-2xl">
            <p className="text-base leading-[1.7] text-muted">
              Selected moments from my professional journey, engineering career
              and community experiences.
            </p>
          </MotionReveal>
        </div>

        <div className="gallery-section__body">
          <AccordionGallery items={galleryItems} defaultIndex={2} expandRatio={0.52} trigger="hover" />
        </div>
      </Container>
    </section>
  );
}
