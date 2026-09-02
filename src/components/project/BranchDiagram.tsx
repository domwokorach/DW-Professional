"use client";

import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

function Node({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.span
      {...reveal}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className="rounded-lg border border-line bg-surface/50 px-4 py-2 text-center text-xs font-mono text-muted"
    >
      {label}
    </motion.span>
  );
}

export default function BranchDiagram({
  title,
  root,
  mid,
  branches,
  footer,
  note,
}: {
  title: string;
  root: string;
  mid?: string;
  branches: string[];
  footer?: string;
  note?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-mono uppercase tracking-widest text-accent">{title}</h2>
      <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted/70">
        Portfolio reconstruction
      </p>

      <div className="mt-5 flex flex-col items-center gap-3">
        <Node label={root} delay={0} />
        <span className="text-accent/60" aria-hidden>
          ↓
        </span>

        {mid && (
          <>
            <Node label={mid} delay={0.08} />
            <span className="text-accent/60" aria-hidden>
              ↓
            </span>
          </>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {branches.map((branch, i) => (
            <div key={branch} className="flex flex-col items-center gap-2">
              <span className="text-accent/60" aria-hidden>
                ↓
              </span>
              <Node label={branch} delay={0.16 + i * 0.08} />
            </div>
          ))}
        </div>

        {footer && (
          <>
            <span className="text-accent/60" aria-hidden>
              ↓
            </span>
            <Node label={footer} delay={0.16 + branches.length * 0.08 + 0.08} />
          </>
        )}
      </div>

      {note && <p className="mt-4 max-w-2xl text-xs leading-[1.7] text-muted">{note}</p>}
    </div>
  );
}
