"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { CaseStudy } from "@/types/caseStudy";
import ReconstructionVisual from "./ReconstructionVisual";

export default function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const isLarge = caseStudy.size === "large";

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white/[0.03] transition-colors duration-200 hover:border-accent/40 ${
        isLarge ? "md:col-span-2" : ""
      }`}
    >
      {caseStudy.mediaType && (
        <div
          className={`relative w-full overflow-hidden border-b border-line bg-surface ${
            caseStudy.mediaType === "video" ? "aspect-video" : "aspect-[16/9]"
          }`}
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
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          )}

          {caseStudy.mediaType === "reconstruction" && (
            <div className="h-full w-full p-3">
              <ReconstructionVisual />
            </div>
          )}
        </div>
      )}

      <div
        className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-accent/0 blur-3xl transition-colors duration-300 group-hover:bg-accent/10"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col justify-between p-8">
        <div>
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-xs uppercase tracking-widest text-accent">
              Case Study
            </span>
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

        <div className="mt-8">
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

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={`/projects/${caseStudy.slug}`}
              aria-label={`View ${caseStudy.title} case study`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-white transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
            >
              <span aria-hidden>View Case Study</span>
              <motion.span
                variants={{ hover: { x: 4, y: -4 } }}
                transition={{ duration: 0.2 }}
                aria-hidden
              >
                →
              </motion.span>
            </Link>

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
        </div>
      </div>
    </motion.article>
  );
}
