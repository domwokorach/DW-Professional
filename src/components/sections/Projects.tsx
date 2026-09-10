import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ProjectCard from "@/components/project/ProjectCard";
import FeaturedProjectCard from "@/components/project/FeaturedProjectCard";
import CaseStudyCard from "@/components/project/CaseStudyCard";
import ProjectDropdownFilter from "@/components/project/ProjectDropdownFilter";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import { projectReveal } from "@/lib/animations";
import ProtectedParagraph from "@/components/ui/ProtectedParagraph";
import { cn } from "@/lib/utils";

const CASE_STUDY_ANCHORS: Record<string, string> = {
  "innovation-x": "innovation-x-internal-search",
  "specialist-disability": "specialist-disability",
  "halifax-piggy-banking": "halifax-piggy-banking",
  "innovation-community": "innovation-community",
  "internal-ai-search-assistant": "internal-ai-search",
  "ui-delivery-transformation": "ui-delivery-transformation",
  "sky-cloud-native-engineering": "sky-cloud-native",
};

const FREELANCE_DROPDOWN_ITEMS = [
  { label: "News", href: "#news" },
  { label: "Dog Booking System", href: "#dog-booking-system" },
  { label: "Air Quality & Weather Forecasting", href: "#air-quality-weather-forecasting" },
  { label: "AI Application Jobs", href: "#ai-application-jobs" },
  { label: "JIRA Project Management System", href: "#jira-project-management-system" },
  { label: "Coding Challenge Assessment", href: "#coding-challenge-assessment" },
];

const CASE_STUDY_DROPDOWN_ITEMS = [
  { label: "Innovation X — Organisation Intelligence Platform", href: "#innovation-x" },
  { label: "Specialist Disability", href: "#specialist-disability" },
  { label: "Halifax Piggy Banking", href: "#halifax-piggy-banking" },
  { label: "Innovation Community", href: "#innovation-community" },
  { label: "Innovation X — Internal Search", href: "#innovation-x-internal-search" },
  { label: "Internal AI Search Assistant", href: "#internal-ai-search" },
  { label: "UI Delivery & Transformation", href: "#ui-delivery-transformation" },
  { label: "Sky — Cloud-Native Engineering", href: "#sky-cloud-native" },
];

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
          <ProtectedParagraph className="text-base leading-[1.7] text-muted">
            A selection of professional projects spanning accessible digital
            banking, frontend engineering, innovation platforms, search
            experiences and UX/UI design, alongside independent freelance
            builds demonstrating API integration and modern software
            development.
          </ProtectedParagraph>
        </MotionReveal>

        <MotionReveal
          delay={0.15}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4"
        >
          <ProjectDropdownFilter
            label="Freelance Projects"
            description="Selected freelance and independent projects built across modern web development, product design and application engineering."
            items={FREELANCE_DROPDOWN_ITEMS}
          />
          <ProjectDropdownFilter
            label="Case Studies"
            description="Selected professional work exploring accessibility, digital banking, frontend engineering and product design."
            items={CASE_STUDY_DROPDOWN_ITEMS}
          />
        </MotionReveal>

        <div className="mt-16 scroll-mt-24">
          <MotionReveal>
            <h3 className="font-mono text-xs uppercase tracking-widest text-accent">
              Freelance Projects
            </h3>
          </MotionReveal>

          <MotionReveal delay={0.05} className="mt-3 max-w-2xl">
            <ProtectedParagraph className="text-sm leading-[1.7] text-muted">
              Selected freelance and independent projects built across modern
              web development, product design and application engineering.
            </ProtectedParagraph>
          </MotionReveal>

          {newsProject && (
            <MotionReveal id="news" className="mt-8 scroll-mt-24">
              <FeaturedProjectCard
                title={newsProject.title}
                subtitle="Modern News Web Application"
                description="A modern news web application focused on presenting current stories through a clean, responsive and easy-to-navigate interface."
                image={newsProject.image}
                imageAlt={newsProject.imageAlt}
                liveUrl={newsProject.liveUrl}
                browserLabel="the-daily-wire-two.vercel.app"
              />
            </MotionReveal>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {otherProjects.map((project, i) => (
              <MotionReveal
                key={project.slug}
                id={project.slug}
                variants={projectReveal}
                delay={0.05 * i}
                className="scroll-mt-24"
              >
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
            <ProtectedParagraph className="text-sm leading-[1.7] text-muted">
              Selected professional work exploring accessibility, digital
              banking, frontend engineering and product design.
            </ProtectedParagraph>
          </MotionReveal>

          {orgGraphCaseStudy && (
            <MotionReveal id="innovation-x" className="mt-8 scroll-mt-24">
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
            </MotionReveal>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {otherCaseStudies.map((caseStudy, i) => (
              <MotionReveal
                key={caseStudy.slug}
                id={CASE_STUDY_ANCHORS[caseStudy.slug]}
                variants={projectReveal}
                delay={0.06 * i}
                className={cn(
                  "scroll-mt-24",
                  caseStudy.size === "large" ? "md:col-span-2" : ""
                )}
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
