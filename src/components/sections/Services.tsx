"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import { services } from "@/data/services";
import { aiCapabilities } from "@/data/aiServices";
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

        <div className="mt-24">
          <MotionReveal>
            <h3 className="text-2xl font-medium text-white sm:text-3xl">
              AI Developer Professional
            </h3>
          </MotionReveal>

          <MotionReveal delay={0.06} className="mt-4 max-w-2xl">
            <p className="text-base leading-[1.7] text-muted">
              I design and ship production-ready AI solutions — from AI
              chatbots and agentic workflows to secure, scalable integrations
              with OpenAI, Anthropic and Gemini. The focus is always business
              outcomes: faster delivery, dependable performance and
              architecture that scales with your product.
            </p>
          </MotionReveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiCapabilities.map((group, i) => (
              <motion.article
                key={group.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: (i % 3) * 0.06,
                }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div
                  className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-accent/0 blur-3xl transition-colors duration-300 group-hover:bg-accent/10"
                  aria-hidden
                />

                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[0_0_30px_rgba(255,255,255,0.04)] transition-all duration-300 ease-out motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:rotate-3 group-hover:border-white/25 group-hover:bg-white/[0.08] sm:h-14 sm:w-14">
                  <group.icon
                    size={22}
                    strokeWidth={1.7}
                    aria-hidden="true"
                    className="text-accent"
                  />
                </div>

                <h4 className="relative mt-5 text-lg font-medium text-white transition-colors duration-200 group-hover:text-white">
                  {group.title}
                </h4>

                <p className="relative mt-2 text-sm leading-[1.6] text-muted">
                  {group.description}
                </p>

                <ul className="relative mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-mono text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
