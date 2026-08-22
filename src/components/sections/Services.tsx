"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import { services } from "@/data/services";
import { fadeUp } from "@/lib/animations";

export default function Services() {
  return (
    <section id="services" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading index="03" label="Services" heading="What I can build for you." />

        <MotionReveal delay={0.1} className="mt-8 max-w-2xl">
          <p className="text-base leading-[1.7] text-muted">
            I help businesses transform ideas into modern, accessible and
            scalable digital products — from high-performance websites and
            frontend applications to custom software and API-driven platforms.
          </p>
        </MotionReveal>

        <div className="mt-16 divide-y divide-line border-t border-line">
          {services.map((service, i) => (
            <MotionReveal key={service.title} variants={fadeUp} delay={0.04 * i}>
              <motion.article
                whileHover="hover"
                className="group grid gap-6 py-10 sm:grid-cols-[minmax(0,280px)_1fr] sm:gap-10"
              >
                <div className="flex items-start justify-between sm:flex-col sm:items-start sm:justify-start">
                  <h3 className="text-2xl font-medium text-white transition-colors duration-200 group-hover:text-accent">
                    {service.title}
                  </h3>
                  <motion.span
                    variants={{ hover: { x: 6 } }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 text-xl text-muted sm:mt-4"
                    aria-hidden
                  >
                    →
                  </motion.span>
                </div>

                <div>
                  <p className="max-w-xl text-sm leading-[1.7] text-muted">
                    {service.description}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {service.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            </MotionReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
