import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";

const paragraphs = [
  "I'm a Software Engineer and Frontend Developer with commercial experience creating modern, accessible and scalable web applications.",
  "My background spans frontend engineering, software development, digital transformation, accessibility, cloud-native development and UX/UI prototyping.",
  "I specialise in React, TypeScript and JavaScript, with experience building reusable component architectures, design systems, responsive interfaces and API-driven applications.",
  "I've contributed to technology teams at organisations including Sky and Lloyds Banking Group, working across frontend development, cloud systems, accessibility, automation and innovation.",
  "I care about more than making interfaces look good. My work focuses on balancing usability, accessibility, performance, maintainability and visual quality.",
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
            <div className="grid gap-6 sm:grid-cols-2">
              {paragraphs.map((p, i) => (
                <MotionReveal key={p} delay={0.05 * i}>
                  <p className="text-base leading-[1.7] text-muted">{p}</p>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
