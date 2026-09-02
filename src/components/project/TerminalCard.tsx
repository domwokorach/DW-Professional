"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { EASE } from "@/lib/animations";
import type { TerminalBlock, TerminalSpec } from "@/types/caseStudy";

const container: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

function BlockContent({ block }: { block: TerminalBlock }) {
  return (
    <>
      <p className="text-white">
        <span className="text-accent/70" aria-hidden="true">
          ${" "}
        </span>
        {block.command}
      </p>
      {block.lines?.map((line, li) => (
        <p key={li} className={line.kind === "success" ? "text-emerald-400" : "text-neutral-400"}>
          {line.text}
        </p>
      ))}
    </>
  );
}

function TerminalChrome({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5"
      aria-hidden="true"
    >
      <span className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
      </span>
      <p className="font-mono text-xs text-white/50">{label}</p>
    </div>
  );
}

export default function TerminalCard({ terminal }: { terminal: TerminalSpec }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-neutral-950 shadow-2xl">
        <TerminalChrome label={terminal.label} />
        <div className="overflow-x-auto p-4 font-mono text-sm leading-7 text-neutral-300 sm:p-8">
          <h3 className="sr-only">Terminal transcript: {terminal.label}</h3>
          {terminal.blocks.map((block, i) => (
            <div key={block.command + i} className={i === 0 ? "" : "mt-5"}>
              <BlockContent block={block} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={container}
      className="overflow-hidden rounded-[24px] border border-white/10 bg-neutral-950 shadow-2xl"
    >
      <TerminalChrome label={terminal.label} />

      <div className="overflow-x-auto p-4 font-mono text-sm leading-7 text-neutral-300 sm:p-8">
        <h3 className="sr-only">Terminal transcript: {terminal.label}</h3>
        {terminal.blocks.map((block, i) => (
          <motion.div key={block.command + i} variants={item} className={i === 0 ? "" : "mt-5"}>
            <BlockContent block={block} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
