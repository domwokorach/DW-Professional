"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/animations";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import UKGreeting from "@/components/ui/UKGreeting";

const headlineLines = ["Software Engineer", "& Frontend Developer"];

export default function Hero() {
  const reduceMotion = useReducedMotion();

  const lineVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.9, ease: EASE, delay: 0.3 + i * 0.13 },
        }),
      };

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24"
    >
      <AnimatedBackground />

      <div className="absolute inset-y-0 right-0 w-full lg:w-[48%]" aria-hidden>
        <div className="relative h-full w-full">
          <Image
            src="/images/dominic/portrait.jpg"
            alt=""
            fill
            priority
            quality={90}
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover object-top opacity-[0.35] lg:opacity-90"
          />
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(9,9,9,1) 0%, rgba(9,9,9,0.88) 35%, rgba(9,9,9,0.3) 75%, rgba(9,9,9,0.1) 100%)",
            }}
          />
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(9,9,9,0.55) 0%, rgba(9,9,9,0.75) 40%, rgba(9,9,9,0.97) 100%)",
            }}
          />
        </div>
      </div>

      <Container className="relative z-10">
        <div className="max-w-2xl">
          <UKGreeting className="mb-5" />

          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="font-mono text-sm tracking-[0.15em] text-accent"
          >
            Software Engineer · Frontend Developer · London
          </motion.p>

          <h1 className="mt-6 text-[clamp(2.75rem,8vw,6rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">
            {headlineLines.map((line, i) => (
              <motion.span
                key={line}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={lineVariants}
                className="block"
              >
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            className="mt-8 max-w-lg text-[clamp(1rem,1.2vw,1.125rem)] leading-[1.7] text-muted"
          >
            I&rsquo;m Dominic, a Software Engineer and Frontend Developer
            specialising in React, TypeScript, JavaScript and modern web
            technologies. I build scalable, accessible and high-performance
            digital products by combining strong software engineering with
            thoughtful UX/UI design. My commercial experience includes
            engineering roles at Sky and Lloyds Banking Group, alongside
            freelance development across modern web applications.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.85 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button href="#projects">View Projects</Button>
            <Button href="#about" variant="secondary">
              About Me
            </Button>
            <Button href="#contact" variant="ghost">
              Get in Touch →
            </Button>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="mt-10 flex items-center gap-2 text-xs text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Available for freelance opportunities
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
