"use client";

import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import FullStackOverview from "@/components/sections/FullStackOverview";
import ShowMoreButton from "@/components/ui/ShowMoreButton";
import ExpandableCardDetails from "@/components/ui/ExpandableCardDetails";
import { useExpandable } from "@/hooks/use-expandable";
import { skillCategories, type SkillItem } from "@/data/skills";
import ProtectedParagraph from "@/components/ui/ProtectedParagraph";

/** Core items stay visible by default; the rest sit behind Show more. */
function splitSkillItems(items: SkillItem[]) {
  const core = items.filter((item) => item.core);
  const summary = core.length > 0 ? core : items.slice(0, Math.min(2, items.length));
  const rest = items.filter((item) => !summary.includes(item));
  return { summary, rest };
}

const CATEGORY_ANCHORS: Record<string, string> = {
  Frontend: "frontend",
  "Backend & APIs": "backend-api",
  "Testing & Quality": "testing-quality",
  "Cloud & DevOps": "cloud-devops",
  "Databases & ORM": "databases-orm",
  "Development Tools": "development-tools",
  "AI & LLM": "ai-llm",
  "Security & Authentication": "security-authentication",
  "UI/UX & Design": "ui-ux-design",
  "CSS & Styling": "css-styling",
};

export default function Expertise() {
  const { visibleItems, hasMore, expanded, toggle, listId } = useExpandable(skillCategories, {
    base: 4,
    sm: 6,
    md: 8,
  });

  return (
    <section id="expertise" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading
          index="02"
          label="Expertise"
          heading="Technologies I work with."
          animateHeading
          headingEffect="typing"
        />

        <MotionReveal delay={0.1} className="mt-8 max-w-2xl">
          <ProtectedParagraph className="text-base leading-[1.7] text-muted">
            A modern engineering stack spanning frontend development, backend
            services and APIs, cloud infrastructure, testing and UX/UI design
            and accessibility. Highlighted items reflect my core, day-to-day stack.
          </ProtectedParagraph>
        </MotionReveal>

        <div id={listId} className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
          {visibleItems.map((category, i) => {
            const { summary, rest } = splitSkillItems(category.items);
            return (
            <motion.article
              key={category.title}
              id={CATEGORY_ANCHORS[category.title]}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.06 }}
              className="group relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div
                className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-accent/0 blur-3xl transition-colors duration-300 group-hover:bg-accent/10"
                aria-hidden
              />

              <div className="relative flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(255,255,255,0.04)] transition-all duration-300 ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:rotate-3 group-hover:border-white/25 group-hover:bg-white/[0.08] sm:h-14 sm:w-14`}
                >
                  <category.icon
                    size={22}
                    strokeWidth={1.7}
                    aria-hidden="true"
                    className={category.accentClassName}
                  />
                </div>
                <span
                  className="text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
                  aria-hidden
                >
                  →
                </span>
              </div>

              <p className="relative mt-4 font-mono text-xs tracking-widest text-muted transition-colors duration-200 group-hover:text-accent">
                {category.index}
              </p>

              <h3 className="relative mt-1 text-lg font-medium text-white transition-colors duration-200 group-hover:text-white">
                {category.title}
              </h3>

              <ProtectedParagraph className="relative mt-2 text-sm leading-[1.6] text-muted">
                {category.description}
              </ProtectedParagraph>

              <ul className="relative mt-5 flex flex-wrap gap-2">
                {summary.map((item) => (
                  <li
                    key={item.name}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      item.core
                        ? "border-white/20 bg-white/[0.05] text-white/90"
                        : "border-white/10 bg-white/[0.03] text-neutral-400"
                    }`}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>

              {rest.length > 0 && (
                <ExpandableCardDetails title={category.title} className="relative">
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {rest.map((item) => (
                      <li
                        key={item.name}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-400"
                      >
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </ExpandableCardDetails>
              )}
            </motion.article>
            );
          })}
          </AnimatePresence>
        </div>

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <ShowMoreButton
              expanded={expanded}
              onToggle={toggle}
              controls={listId}
              label="technology categories"
            />
          </div>
        )}

        <MotionReveal delay={0.15} className="mt-10 flex items-center gap-2 text-xs text-muted">
          <span className="h-2 w-2 rounded-full border border-white/20 bg-white/[0.05]" aria-hidden />
          Core, day-to-day stack
          <span className="mx-2 text-line" aria-hidden>
            ·
          </span>
          <span className="h-2 w-2 rounded-full border border-white/10 bg-white/[0.03]" aria-hidden />
          Additional technologies
        </MotionReveal>

        <FullStackOverview />
      </Container>
    </section>
  );
}
