"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Project } from "@/types/project";
import GithubIcon from "./GithubIcon";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white/[0.03] transition-colors duration-200 hover:border-accent/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-surface">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col p-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            Project 0{index + 1}
          </span>
        </div>

        <h3 className="mt-4 text-2xl font-medium text-white">{project.title}</h3>
        <p className="mt-3 text-sm leading-[1.7] text-muted">{project.description}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {project.technology.map((t) => (
            <li
              key={t}
              className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
            >
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-8">
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            View Live Project
            <ExternalLink
              aria-hidden
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>

          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}

          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            Details <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
