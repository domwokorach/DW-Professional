"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function AnimatedBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-accent/25 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 left-[-15%] h-[30rem] w-[30rem] rounded-full bg-accent2/20 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -30, 25, 0], y: [0, 25, -15, 0], scale: [1, 0.94, 1.06, 1] }
        }
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-1/4 h-[26rem] w-[26rem] rounded-full bg-accent3/10 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 20, -25, 0], y: [0, -20, 15, 0] }
        }
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="grid-bg absolute inset-0 opacity-40" />
    </div>
  );
}
