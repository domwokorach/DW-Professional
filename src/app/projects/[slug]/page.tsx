import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import { projects } from "@/data/projects";
import type { Project } from "@/types/project";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} | Dominic Wokorach Olanya`,
    description: project.description,
  };
}

const fields: { key: keyof Project; label: string }[] = [
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

  if (!project) notFound();

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
          {project.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.technology.map((t) => (
            <span
              key={t}
              className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {fields.map(
              ({ key, label }) =>
                project[key] && (
                  <div key={key}>
                    <h2 className="text-sm font-mono uppercase tracking-widest text-accent">
                      {label}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-[1.7] text-muted">
                      {project[key] as string}
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
              {project.features.map((f) => (
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
