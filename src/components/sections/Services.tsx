"use client";

import { motion } from "framer-motion";
import Grid from "@mui/material/Grid";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import TextType from "@/components/ui/TextType";
import { services } from "@/data/services";
import { aiCapabilities } from "@/data/aiServices";
import { fadeUp } from "@/lib/animations";
import ProtectedParagraph from "@/components/ui/ProtectedParagraph";

const SERVICE_ANCHORS: Record<string, string> = {
  "Specialist Accessibility": "specialist-accessibility",
  "AI Developer & Testing Tools": "ai-developer-testing",
  "Frontend Development": "frontend-development",
  "UX/UI Development": "ux-ui-development",
  "Web Applications": "web-applications",
  "Software Engineering": "software-engineering",
};

const AI_CAPABILITY_ANCHORS: Record<string, string> = {
  "AI Products & Applications": "ai-products",
  "LLMs & Agentic Workflows": "agentic-workflows",
  "RAG & Intelligent Search": "rag-search",
  "AI API & Model Integrations": "ai-integrations",
  "AI Backend & Python Development": "ai-backend-python",
  "Deployment & Production Readiness": "production-readiness",
};

export default function Services() {
  return (
    <section id="services" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <SectionHeading
          index="03"
          label="Services"
          heading="What I can build for you."
          animateHeading
          headingEffect="typing"
        />

        <MotionReveal delay={0.1} className="mt-8 max-w-2xl">
          <ProtectedParagraph className="text-base leading-[1.7] text-muted">
            I help businesses transform ideas into modern, accessible and
            scalable digital products — from high-performance websites and
            frontend applications to custom software and API-driven platforms.
          </ProtectedParagraph>
        </MotionReveal>

        <Grid
          container
          className="mt-16"
          rowSpacing={{ xs: 2, sm: 3, md: 4 }}
          columnSpacing={{ xs: 2, sm: 3, md: 4 }}
        >
          {services.map((service, i) => (
            <Grid key={service.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <MotionReveal
                id={SERVICE_ANCHORS[service.title]}
                variants={fadeUp}
                delay={0.04 * i}
                className="block h-full scroll-mt-24"
              >
                <motion.article
                  whileHover="hover"
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="break-words text-xl font-medium text-white transition-colors duration-200 group-hover:text-accent">
                      {service.title}
                    </h3>
                    <motion.span
                      variants={{ hover: { x: 6 } }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-xl text-muted"
                      aria-hidden
                    >
                      →
                    </motion.span>
                  </div>

                  <ProtectedParagraph className="mt-3 flex-1 text-sm leading-[1.7] text-muted">
                    {service.description}
                  </ProtectedParagraph>

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
                </motion.article>
              </MotionReveal>
            </Grid>
          ))}
        </Grid>

        <div id="ai-professional" className="mt-24 scroll-mt-24">
          <MotionReveal>
            <h3 className="text-2xl font-medium text-white sm:text-3xl">
              <TextType text="AI Developer Professional" />
            </h3>
          </MotionReveal>

          <MotionReveal delay={0.06} className="mt-4 max-w-2xl">
            <ProtectedParagraph className="text-base leading-[1.7] text-muted">
              I design and ship production-ready AI solutions — from AI
              chatbots and agentic workflows to secure, scalable integrations
              with OpenAI, Anthropic and Gemini. The focus is always business
              outcomes: faster delivery, dependable performance and
              architecture that scales with your product.
            </ProtectedParagraph>
          </MotionReveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {aiCapabilities.map((group, i) => (
              <motion.article
                key={group.title}
                id={AI_CAPABILITY_ANCHORS[group.title]}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: (i % 3) * 0.06,
                }}
                className="group relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
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

                <ProtectedParagraph className="relative mt-2 text-sm leading-[1.6] text-muted">
                  {group.description}
                </ProtectedParagraph>

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
