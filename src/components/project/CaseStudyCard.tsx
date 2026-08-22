"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CaseStudy } from "@/types/caseStudy";

export default function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const isLarge = caseStudy.size === "large";

  return (
    <motion.article
      whileHover="hover"
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface/50 p-8 transition-colors duration-200 hover:border-accent/40 ${
        isLarge ? "md:col-span-2" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-accent/0 blur-3xl transition-colors duration-300 group-hover:bg-accent/10"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-xs text-muted">{caseStudy.number}</span>
          {caseStudy.label && (
            <span className="rounded-full border border-accent/30 px-3 py-1 text-xs font-mono text-accent">
              {caseStudy.label}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-2xl font-medium text-white transition-colors duration-200 group-hover:text-accent sm:text-3xl">
          {caseStudy.title}
        </h3>
        <p className="mt-2 text-sm text-muted">{caseStudy.subtitle}</p>

        <p className="mt-4 max-w-xl text-sm leading-[1.7] text-muted">{caseStudy.summary}</p>

        <p className="mt-5 font-mono text-xs text-muted">
          {caseStudy.categories.join(" · ")}
        </p>
      </div>

      <div className="relative mt-8 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {caseStudy.technology.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
            >
              {tech}
            </span>
          ))}
        </div>

        <Link
          href={`/projects/${caseStudy.slug}`}
          aria-label={`View ${caseStudy.title} case study`}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          <span aria-hidden>View Case Study</span>
          <motion.span variants={{ hover: { x: 4, y: -4 } }} transition={{ duration: 0.2 }} aria-hidden>
            →
          </motion.span>
        </Link>
      </div>
    </motion.article>
  );
}
