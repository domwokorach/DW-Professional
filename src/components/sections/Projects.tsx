import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ProjectCard from "@/components/project/ProjectCard";
import { projects } from "@/data/projects";
import { projectReveal } from "@/lib/animations";

export default function Projects() {
  return (
    <section id="projects" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading index="03" label="Projects" heading="Selected Work" />

        <MotionReveal delay={0.1} className="mt-8 max-w-2xl">
          <p className="text-base leading-[1.7] text-muted">
            A selection of applications demonstrating frontend engineering,
            API integration, responsive design and modern software
            development.
          </p>
        </MotionReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <MotionReveal key={project.slug} variants={projectReveal} delay={0.05 * i}>
              <ProjectCard project={project} index={i} />
            </MotionReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
