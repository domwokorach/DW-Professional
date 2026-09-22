"use client";

import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import ProjectCard from "@/components/project/ProjectCard";
import FeaturedProjectCard from "@/components/project/FeaturedProjectCard";
import CaseStudyCard from "@/components/project/CaseStudyCard";
import ProjectDropdownFilter from "@/components/project/ProjectDropdownFilter";
import ShowMoreButton from "@/components/ui/ShowMoreButton";
import { useExpandable } from "@/hooks/use-expandable";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import { projectReveal } from "@/lib/animations";
import ProtectedParagraph from "@/components/ui/ProtectedParagraph";

const COLLAPSE_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;

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
  const orgGraphCaseStudy = caseStudies.find((c) => c.slug === "innovation-x-org-graph");
  const otherCaseStudies = caseStudies.filter((c) => c.slug !== "innovation-x-org-graph");

  const projectsList = useExpandable(projects, { base: 4, sm: 6, md: 6 });
  const caseStudiesList = useExpandable(otherCaseStudies, { base: 4, sm: 6, md: 6 });

  return (
    <section id="projects" className="relative scroll-mt-24 border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading
          index="04"
          label="Projects"
          heading="Selected Work"
          animateHeading
          headingEffect="typing"
          typingSpeed={32}
        />

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

          <div
            id={projectsList.listId}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8"
          >
            <AnimatePresence initial={false}>
              {projectsList.visibleItems.map((project, i) => (
                <motion.div
                  key={project.slug}
                  exit={{ opacity: 0, y: 8, transition: COLLAPSE_TRANSITION }}
                >
                  <MotionReveal
                    id={project.slug}
                    variants={projectReveal}
                    delay={0.05 * i}
                    className="block h-full scroll-mt-24"
                  >
                    <ProjectCard project={project} index={i} />
                  </MotionReveal>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {projectsList.hasMore && (
            <div className="mt-8 flex justify-center">
              <ShowMoreButton
                expanded={projectsList.expanded}
                onToggle={projectsList.toggle}
                controls={projectsList.listId}
                label="freelance projects"
              />
            </div>
          )}
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

          <div
            id={caseStudiesList.listId}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8"
          >
            <AnimatePresence initial={false}>
            {caseStudiesList.visibleItems.map((caseStudy, i) => (
              <motion.div
                key={caseStudy.slug}
                exit={{ opacity: 0, y: 8, transition: COLLAPSE_TRANSITION }}
              >
                <MotionReveal
                  id={CASE_STUDY_ANCHORS[caseStudy.slug]}
                  variants={projectReveal}
                  delay={0.06 * i}
                  className="block h-full scroll-mt-24"
                >
                  <CaseStudyCard caseStudy={caseStudy} />
                </MotionReveal>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>

          {caseStudiesList.hasMore && (
            <div className="mt-8 flex justify-center">
              <ShowMoreButton
                expanded={caseStudiesList.expanded}
                onToggle={caseStudiesList.toggle}
                controls={caseStudiesList.listId}
                label="case studies"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
