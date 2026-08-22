"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/animations";

export default function MotionReveal({
  children,
  variants = fadeUp,
  className,
  delay = 0,
  amount = 0.2,
  as = "div",
}: {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
  amount?: number;
  as?: "div" | "li";
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  if (reduceMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </Component>
  );
}
