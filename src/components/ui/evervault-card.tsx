"use client";
// Adapted from Aceternity UI "evervault-card" (https://ui.aceternity.com/registry/evervault-card.json).
// Kept: CardPattern (pointer-centred radial mask over a gradient + random-character layer) and
// generateRandomString, unchanged in behaviour. Changes for this portfolio:
// - Tailwind classes replaced with scoped CSS (`ev-*` in styles/developer-id.css)
// - `backdrop-blur` dropped (it breaks inside the Developer ID's 3D flip)
// - hover opacity is driven by the parent layer instead of a Tailwind `group`
// - the demo wrapper (EvervaultCard with its text bubble) and Icon are omitted: unused here
import { motion, useMotionTemplate, type MotionValue } from "motion/react";

export function CardPattern({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="ev-pattern">
      <div className="ev-pattern__fade" />
      <motion.div className="ev-pattern__gradient" style={style} />
      <motion.div className="ev-pattern__chars" style={style}>
        <p>{randomString}</p>
      </motion.div>
    </div>
  );
}

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
