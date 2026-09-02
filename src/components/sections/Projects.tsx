import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ProjectCard from "@/components/project/ProjectCard";
import CaseStudyCard from "@/components/project/CaseStudyCard";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import { projectReveal } from "@/lib/animations";

export default function Projects() {
  return (
    <section id="projects" className="relative scroll-mt-24 border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading index="04" label="Projects" heading="Selected Work" />

        <MotionReveal delay={0.1} className="mt-8 max-w-2xl">
          <p className="text-base leading-[1.7] text-muted">
            A selection of professional projects spanning accessible digital
            banking, frontend engineering, innovation platforms, search
            experiences and UX/UI design, alongside independent freelance
            builds demonstrating API integration and modern software
            development.
          </p>
        </MotionReveal>

        <div className="mt-16 scroll-mt-24">
          <MotionReveal>
            <h3 className="font-mono text-xs uppercase tracking-widest text-accent">
              Freelance Projects
            </h3>
          </MotionReveal>

          <MotionReveal delay={0.05} className="mt-3 max-w-2xl">
            <p className="text-sm leading-[1.7] text-muted">
              Selected freelance and independent projects built across modern
              web development, product design and application engineering.
            </p>
          </MotionReveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {projects.map((project, i) => (
              <MotionReveal key={project.slug} variants={projectReveal} delay={0.05 * i}>
                <ProjectCard project={project} index={i} />
              </MotionReveal>
            ))}
          </div>
        </div>

        <div id="case-studies" className="mt-24 scroll-mt-24">
          <MotionReveal>
            <h3 className="font-mono text-xs uppercase tracking-widest text-accent">
              Case Studies
            </h3>
          </MotionReveal>

          <MotionReveal delay={0.05} className="mt-3 max-w-2xl">
            <p className="text-sm leading-[1.7] text-muted">
              Selected professional work exploring accessibility, digital
              banking, frontend engineering and product design.
            </p>
          </MotionReveal>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {caseStudies.map((caseStudy, i) => (
              <MotionReveal
                key={caseStudy.slug}
                variants={projectReveal}
                delay={0.06 * i}
                className={caseStudy.size === "large" ? "md:col-span-2" : ""}
              >
                <CaseStudyCard caseStudy={caseStudy} />
              </MotionReveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
