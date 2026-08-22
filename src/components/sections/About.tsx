"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import { skillCategories } from "@/data/skills";
import { staggerContainer, fadeUp } from "@/lib/animations";
import { motion } from "framer-motion";

const paragraphs = [
  "I'm a Software Engineer and Frontend Developer with commercial experience creating modern, accessible and scalable web applications.",
  "My background spans frontend engineering, software development, digital transformation, accessibility, cloud-native development and UX/UI prototyping.",
  "I specialise in React, TypeScript and JavaScript, with experience building reusable component architectures, design systems, responsive interfaces and API-driven applications.",
  "I've contributed to technology teams at organisations including Sky and Lloyds Banking Group, working across frontend development, cloud systems, accessibility, automation and innovation.",
  "I care about more than making interfaces look good. My work focuses on balancing usability, accessibility, performance, maintainability and visual quality.",
];

export default function About() {
  return (
    <section id="about" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
          <SectionHeading
            index="01"
            label="About"
            heading="Engineering thoughtful digital experiences."
          />

          <div>
            <div className="grid gap-6 sm:grid-cols-2">
              {paragraphs.map((p, i) => (
                <MotionReveal key={p} delay={0.05 * i}>
                  <p className="text-base leading-[1.7] text-muted">{p}</p>
                </MotionReveal>
              ))}
            </div>

            <div className="mt-16">
              <MotionReveal
                variants={staggerContainer}
                className="grid gap-4 sm:grid-cols-2"
              >
                {skillCategories.map((category) => (
                  <motion.div
                    key={category.title}
                    variants={fadeUp}
                    className="group rounded-2xl border border-line bg-surface/50 p-6 transition-colors duration-200 hover:border-accent/40 hover:bg-surface/80"
                  >
                    <h3 className="text-sm font-mono uppercase tracking-widest text-accent">
                      {category.title}
                    </h3>
                    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                      {category.items.map((item) => (
                        <li
                          key={item}
                          className="text-sm text-muted transition-colors duration-150 group-hover:text-white/90"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </MotionReveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
