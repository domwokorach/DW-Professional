"use client";

import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function WorkflowPipeline({
  title,
  stages,
  note,
}: {
  title: string;
  stages: string[];
  note?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-mono uppercase tracking-widest text-accent">{title}</h2>
      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-3">
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <motion.span
              {...reveal}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="rounded-full border border-line bg-surface/50 px-4 py-2 text-xs font-mono text-muted"
            >
              {stage}
            </motion.span>
            {i < stages.length - 1 && (
              <span className="text-accent/60" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      {note && <p className="mt-4 max-w-2xl text-xs leading-[1.7] text-muted">{note}</p>}
    </div>
  );
}
