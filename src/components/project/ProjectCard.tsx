"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Project } from "@/types/project";

export default function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <motion.article
      whileHover="hover"
      className="group flex h-full flex-col rounded-2xl border border-line bg-surface/50 p-8 transition-colors duration-200 hover:border-accent/40"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">
          Project 0{index + 1}
        </span>
        <motion.span
          variants={{ hover: { x: 4, y: -4 } }}
          transition={{ duration: 0.2 }}
          className="text-lg text-muted"
          aria-hidden
        >
          ↗
        </motion.span>
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

      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {project.features.slice(0, 4).map((f) => (
          <li key={f} className="text-xs text-muted before:mr-1.5 before:text-accent before:content-['—']">
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          View Project <span aria-hidden>→</span>
        </Link>
      </div>
    </motion.article>
  );
}
