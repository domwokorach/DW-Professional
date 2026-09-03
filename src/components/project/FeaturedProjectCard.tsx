"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { EASE } from "@/lib/animations";

export default function FeaturedProjectCard({
  eyebrow = "Selected Work",
  title,
  subtitle,
  description,
  image,
  imageAlt,
  liveUrl,
  browserLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  liveUrl: string;
  browserLabel: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: EASE }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/20"
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-3"
      >
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </span>
        <span className="ml-2 truncate font-mono text-xs text-muted">
          {browserLabel}
        </span>
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 900px, 100vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </div>

      <div className="p-6 md:p-8">
        <span className="font-mono text-xs uppercase tracking-widest text-accent">
          {eyebrow}
        </span>

        <h3 className="mt-3 text-2xl font-medium text-white md:text-3xl">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>

        <p className="mt-4 max-w-2xl text-sm leading-[1.7] text-muted">
          {description}
        </p>

        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          View Live Project
          <ExternalLink
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>
      </div>
    </motion.article>
  );
}
