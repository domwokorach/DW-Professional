"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { cn } from "@/lib/utils";

// Adapted from Aceternity UI's Tracing Beam (`npx shadcn add
// @aceternity/tracing-beam-demo`). Changes from upstream:
// - The rail lives inside the wrapper's left padding instead of negative
//   offsets, so it can never overlap text or cause horizontal scroll.
// - Height is tracked with a ResizeObserver, so the path stays aligned when
//   accordions expand/collapse or the viewport resizes.
// - Beam length grows with scroll speed and eases back when scrolling stops.
// - Colours come from the theme tokens, so light/dark switch automatically.
// - prefers-reduced-motion renders a static rail with no scroll listeners.

const RAIL_WIDTH = 20;
const KINK_TOP = 24;
const KINK_DEPTH = 12;
const SPRING = { stiffness: 500, damping: 90 };

function railPath(height: number) {
  // A vertical line with a short diagonal step near each end. Below ~120px
  // there's no room for the steps, so fall back to a straight line.
  if (height < 120) return `M 4 0 V ${height}`;
  const x2 = 4 + KINK_DEPTH;
  return [
    `M 4 0`,
    `V ${KINK_TOP}`,
    `L ${x2} ${KINK_TOP + KINK_DEPTH * 1.5}`,
    `V ${height - KINK_TOP - KINK_DEPTH * 1.5}`,
    `L 4 ${height - KINK_TOP}`,
    `V ${height}`,
  ].join(" ");
}

export function TracingBeam({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gradientId = `tracing-beam-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const [svgHeight, setSvgHeight] = useState(0);
  const [started, setStarted] = useState(false);
  const height = useMotionValue(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const update = () => {
      const next = node.offsetHeight;
      height.set(next);
      setSvgHeight(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [height]);

  // 0 when the section's top reaches the middle of the viewport, 1 when its
  // bottom does — so the beam head tracks the reader's eye line.
  const { scrollY, scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = p > 0;
    if (next !== started) setStarted(next);
  });

  const head = useSpring(
    useTransform([scrollYProgress, height], ([p, h]: number[]) => p * h),
    SPRING
  );

  // Faster scrolling stretches the beam; the spring lets it ease back.
  const velocity = useVelocity(scrollY);
  const length = useSpring(
    useTransform([velocity, height], ([v, h]: number[]) => {
      const base = Math.min(160, h * 0.25);
      return base + Math.min(Math.abs(v) * 0.15, 240);
    }),
    { stiffness: 120, damping: 30 }
  );
  const tail = useTransform([head, length], ([y, l]: number[]) => y - l);

  return (
    <div ref={ref} className={cn("relative pl-8 sm:pl-10", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0">
        <span
          className={cn(
            "absolute -top-1.5 left-[-4px] flex h-4 w-4 items-center justify-center rounded-full border border-line bg-ink transition-shadow duration-200",
            !started && !reduceMotion && "shadow-[0_3px_8px_rgba(0,0,0,0.24)]"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full border transition-colors duration-200",
              started || reduceMotion
                ? "border-accent bg-accent"
                : "border-line bg-surface"
            )}
          />
        </span>

        {svgHeight > 0 && (
          <svg
            viewBox={`0 0 ${RAIL_WIDTH} ${svgHeight}`}
            width={RAIL_WIDTH}
            height={svgHeight}
            className="block"
            focusable="false"
          >
            <path
              d={railPath(svgHeight)}
              fill="none"
              strokeWidth="1"
              style={{ stroke: "var(--color-line)" }}
            />
            {reduceMotion ? (
              <path
                d={railPath(svgHeight)}
                fill="none"
                strokeWidth="1.25"
                style={{ stroke: "rgb(var(--color-accent) / 0.45)" }}
              />
            ) : (
              <>
                <path
                  d={railPath(svgHeight)}
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  stroke={`url(#${gradientId})`}
                />
                <defs>
                  <motion.linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    x2="0"
                    y1={tail}
                    y2={head}
                  >
                    <stop offset="0" style={{ stopColor: "rgb(var(--color-accent2))", stopOpacity: 0 }} />
                    <stop offset="0.55" style={{ stopColor: "rgb(var(--color-accent2))" }} />
                    <stop offset="0.9" style={{ stopColor: "rgb(var(--color-accent))" }} />
                    <stop offset="0.98" style={{ stopColor: "rgb(var(--color-accent3))" }} />
                    <stop offset="1" style={{ stopColor: "rgb(var(--color-accent3))", stopOpacity: 0 }} />
                  </motion.linearGradient>
                </defs>
              </>
            )}
          </svg>
        )}
      </div>

      <div ref={contentRef}>{children}</div>
    </div>
  );
}
