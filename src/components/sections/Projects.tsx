import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ProjectCard from "@/components/project/ProjectCard";
import FeaturedProjectCard from "@/components/project/FeaturedProjectCard";
import CaseStudyCard from "@/components/project/CaseStudyCard";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import { projectReveal } from "@/lib/animations";

export default function Projects() {
  const newsProject = projects.find((p) => p.slug === "news");
  const otherProjects = projects.filter((p) => p.slug !== "news");

  const orgGraphCaseStudy = caseStudies.find((c) => c.slug === "innovation-x-org-graph");
  const otherCaseStudies = caseStudies.filter((c) => c.slug !== "innovation-x-org-graph");

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

          {newsProject && (
            <div className="mt-8">
              <FeaturedProjectCard
                title={newsProject.title}
                subtitle="Modern News Web Application"
                description="A modern news web application focused on presenting current stories through a clean, responsive and easy-to-navigate interface."
                image={newsProject.image}
                imageAlt={newsProject.imageAlt}
                liveUrl={newsProject.liveUrl}
                browserLabel="the-daily-wire-two.vercel.app"
              />
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {otherProjects.map((project, i) => (
              <MotionReveal key={project.slug} variants={projectReveal} delay={0.05 * i}>
                <ProjectCard project={project} index={i + 1} />
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

          {orgGraphCaseStudy && (
            <div className="mt-8">
              <FeaturedProjectCard
                eyebrow="Case Study"
                title={orgGraphCaseStudy.title}
                subtitle={orgGraphCaseStudy.subtitle}
                description={orgGraphCaseStudy.summary}
                image="/images/case-studies/innovation-x-org-graph.webp"
                imageAlt="Innovation X organisation overview platform showing an interactive D3.js graph of departments, teams, roles and people"
                liveUrl={orgGraphCaseStudy.externalHref ?? "https://organisation-overview.vercel.app/"}
                browserLabel="organisation-overview.vercel.app"
              />
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {otherCaseStudies.map((caseStudy, i) => (
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
