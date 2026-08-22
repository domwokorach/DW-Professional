"use client";

import { motion } from "framer-motion";
import { timelineDot, timelineReveal } from "@/lib/animations";
import type { ExperienceItem } from "@/types/experience";

export default function TimelineItem({ item }: { item: ExperienceItem }) {
  return (
    <motion.li
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative pl-8"
    >
      <motion.span
        variants={timelineDot}
        className="absolute -left-[0.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"
      />
      <motion.div variants={timelineReveal}>
        <p className="font-mono text-xs text-accent">{item.period}</p>
        <h3 className="mt-2 text-lg font-medium text-white">{item.role}</h3>
        {item.org && <p className="text-sm text-muted">{item.org}</p>}
        {item.location && <p className="text-xs text-muted">{item.location}</p>}

        {item.points.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {item.points.map((pt) => (
              <li
                key={pt}
                className="text-sm leading-[1.7] text-muted before:mr-2 before:text-accent before:content-['—']"
              >
                {pt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-[1.7] text-muted">{item.focus}</p>
        )}

        {item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.li>
  );
}
