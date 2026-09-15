import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ProtectedParagraph from "@/components/ui/ProtectedParagraph";

const paragraphs = [
  "Frontend Software Engineer with commercial experience at Sky and Lloyds Banking Group, specialising in React, TypeScript and accessible digital products.",
  "Proven track record of delivering scalable web applications, improving user experiences and collaborating with Agile teams.",
  "Passionate about technology, innovation and creating inclusive solutions for diverse audiences.",
];

export default function About() {
  return (
    <section id="about" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
          <SectionHeading
            index="01"
            label="About"
            heading="Engineering thoughtful digital experiences."
          />

          <div>
            <div className="grid max-w-2xl gap-6">
              {paragraphs.map((p, i) => (
                <MotionReveal key={p} delay={0.05 * i}>
                  <ProtectedParagraph className="text-base leading-[1.7] text-muted">
                    {p}
                  </ProtectedParagraph>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
