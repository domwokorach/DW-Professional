import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import { projects } from "@/data/projects";
import { caseStudies } from "@/data/caseStudies";
import ChatbotMockup from "@/components/project/ChatbotMockup";
import ReconstructionVisual from "@/components/project/ReconstructionVisual";
import GithubIcon from "@/components/project/GithubIcon";
import WorkflowPipeline from "@/components/project/WorkflowPipeline";
import BranchDiagram from "@/components/project/BranchDiagram";
import TerminalCard from "@/components/project/TerminalCard";
import type { Project } from "@/types/project";

export function generateStaticParams() {
  return [...projects.map((p) => ({ slug: p.slug })), ...caseStudies.map((c) => ({ slug: c.slug }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  const caseStudy = caseStudies.find((c) => c.slug === slug);

  if (project) {
    return {
      title: `${project.title} | Dominic Wokorach Olanya`,
      description: project.description,
    };
  }

  if (caseStudy) {
    return {
      title: `${caseStudy.title} | Dominic Wokorach Olanya`,
      description: caseStudy.summary,
    };
  }

  return {};
}

const projectFields: { key: keyof Project; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "challenge", label: "Challenge" },
  { key: "approach", label: "Approach" },
  { key: "outcome", label: "Outcome" },
];

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  const caseStudy = caseStudies.find((c) => c.slug === slug);

  if (!project && !caseStudy) notFound();

  if (caseStudy) {
    const sections: { label: string; text?: string }[] = [
      { label: "Context", text: caseStudy.context },
      { label: "Challenge", text: caseStudy.challenge },
      { label: "Idea", text: caseStudy.idea },
      { label: "Experience", text: caseStudy.experience },
      { label: "UX/UI Approach", text: caseStudy.uxApproach },
      { label: "Engineering Approach", text: caseStudy.engineeringApproach },
      { label: "Accessibility", text: caseStudy.accessibility },
    ];

    return (
      <article className="py-32 sm:py-40">
        <Container>
          <Link href="/#projects" className="text-sm text-muted hover:text-white transition-colors">
            ← Back to selected work
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              {caseStudy.title}
            </h1>
            {caseStudy.label && (
              <span className="rounded-full border border-accent/30 px-3 py-1 text-xs font-mono text-accent">
                {caseStudy.label}
              </span>
            )}
          </div>

          <p className="mt-3 max-w-2xl text-base text-muted">{caseStudy.subtitle}</p>

          <p className="mt-2 font-mono text-xs text-muted">{caseStudy.categories.join(" · ")}</p>

          {caseStudy.mediaType && (
            <div
              className={`relative mt-10 w-full overflow-hidden rounded-2xl border border-line bg-surface ${
                caseStudy.mediaType === "video" ? "aspect-video" : "aspect-[16/9]"
              } max-w-4xl`}
            >
              {caseStudy.mediaType === "video" && caseStudy.mediaSrc && (
                <video
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={caseStudy.mediaAlt ?? `${caseStudy.title} video walkthrough`}
                  className="h-full w-full object-cover"
                >
                  <source src={caseStudy.mediaSrc} />
                </video>
              )}
              {caseStudy.mediaType === "image" && caseStudy.mediaSrc && (
                <Image
                  src={caseStudy.mediaSrc}
                  alt={caseStudy.mediaAlt ?? caseStudy.title}
                  fill
                  sizes="(min-width: 1024px) 800px, 100vw"
                  className="object-cover object-top"
                />
              )}
              {caseStudy.mediaType === "reconstruction" && (
                <div className="h-full w-full p-4">
                  <ReconstructionVisual />
                </div>
              )}
            </div>
          )}

          {(caseStudy.prototypeHref || caseStudy.externalHref) && (
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
              {caseStudy.prototypeHref && (
                <a
                  href={caseStudy.prototypeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                >
                  View Prototype
                  <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                </a>
              )}
              {caseStudy.externalHref && (
                <a
                  href={caseStudy.externalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                >
                  {caseStudy.externalLabel ?? "Visit Website"}
                  <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_320px]">
            <div className="space-y-10">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                  Overview
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-[1.7] text-muted">
                  {caseStudy.summary}
                </p>
              </div>

              {caseStudy.mockup === "chatbot" && <ChatbotMockup />}

              {sections.map(
                ({ label, text }) =>
                  text && (
                    <div key={label}>
                      <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                        {label}
                      </h2>
                      <p className="mt-3 max-w-2xl text-base leading-[1.7] text-muted">{text}</p>
                    </div>
                  )
              )}

              {caseStudy.workflow && (
                <WorkflowPipeline
                  title="Engineering Workflow"
                  stages={caseStudy.workflow}
                  note="A representative workflow illustrating the general path from issue to release, rather than a claim that every change followed an identical sequence."
                />
              )}

              {caseStudy.jiraWorkflow && (
                <WorkflowPipeline title="Team Board Workflow" stages={caseStudy.jiraWorkflow} />
              )}

              {caseStudy.branchDiagrams?.map((diagram) => (
                <BranchDiagram key={diagram.title} {...diagram} />
              ))}

              {caseStudy.pipelines?.map((pipeline) => (
                <WorkflowPipeline key={pipeline.title} {...pipeline} />
              ))}

              <div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                  My Contribution
                </h2>
                <ul className="mt-3 space-y-2">
                  {caseStudy.contribution.map((c) => (
                    <li
                      key={c}
                      className="max-w-2xl text-base leading-[1.7] text-muted before:mr-2 before:text-accent before:content-['—']"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {caseStudy.terminal && (
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                      {caseStudy.terminal.heading}
                    </h2>
                    <span className="rounded-full border border-accent/30 px-3 py-1 text-xs font-mono text-accent">
                      Portfolio Reconstruction
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-muted">
                    {caseStudy.terminal.subtitle}
                  </p>

                  <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_3fr] lg:items-start">
                    <p className="text-base leading-[1.7] text-muted">
                      {caseStudy.terminal.intro}
                    </p>

                    <div>
                      <TerminalCard terminal={caseStudy.terminal} />
                      <p className="mt-3 text-xs leading-[1.6] text-muted">
                        {caseStudy.terminal.caption}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                  {caseStudy.outcome.heading}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-[1.7] text-muted">
                  {caseStudy.outcome.text}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                Technology
              </h2>
              <ul className="mt-3 space-y-2">
                {caseStudy.technology.map((t) => (
                  <li
                    key={t}
                    className="text-sm leading-[1.7] text-muted before:mr-2 before:text-accent before:content-['—']"
                  >
                    {t}
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-xs leading-[1.6] text-muted">
                Visual direction: {caseStudy.visualDirection}
              </p>
            </div>
          </div>
        </Container>
      </article>
    );
  }

  const proj = project!;

  return (
    <article className="py-32 sm:py-40">
      <Container>
        <Link
          href="/#projects"
          className="text-sm text-muted hover:text-white transition-colors"
        >
          ← Back to projects
        </Link>

        <h1 className="mt-8 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
          {proj.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {proj.technology.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="relative mt-10 aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface">
          <Image
            src={proj.image}
            alt={proj.imageAlt}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover object-top"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <a
            href={proj.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            View Live Project
            <ExternalLink aria-hidden className="h-3.5 w-3.5" />
          </a>
          {proj.repoUrl && (
            <a
              href={proj.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {projectFields.map(
              ({ key, label }) =>
                proj[key] && (
                  <div key={key}>
                    <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                      {label}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-[1.7] text-muted">
                      {proj[key] as string}
                    </p>
                  </div>
                )
            )}
          </div>

          <div>
            <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
              Features
            </h2>
            <ul className="mt-3 space-y-2">
              {proj.features.map((f) => (
                <li
                  key={f}
                  className="text-sm leading-[1.7] text-muted before:mr-2 before:text-accent before:content-['—']"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </article>
  );
}
