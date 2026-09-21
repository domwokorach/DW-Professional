"use client";

import type { ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

/**
 * Wraps inline text with a subtle scroll-velocity reactive transform.
 * Direction and magnitude follow scroll speed/direction; range is clamped
 * tightly so the text stays fully readable (no marquee, no duplication).
 */
export default function ScrollVelocityText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const staticVelocity = useMotionValue(0);
  const scrollVelocity = reduceMotion ? staticVelocity : rawVelocity;

  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 40,
    stiffness: 300,
    mass: 0.5,
  });

  const skewX = useTransform(smoothVelocity, [-1500, 0, 1500], [-3, 0, 3], {
    clamp: true,
  });
  const x = useTransform(smoothVelocity, [-1500, 0, 1500], [-2.5, 0, 2.5], {
    clamp: true,
  });

  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      style={{
        display: "inline-block",
        x,
        skewX,
        willChange: "transform",
      }}
    >
      {children}
    </motion.span>
  );
}
