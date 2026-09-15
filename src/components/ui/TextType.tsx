"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextTypeProps {
  text: string;
  className?: string;
  /** Ms between each character being revealed. */
  typingSpeed?: number;
  /** Delay before typing starts once the text scrolls into view, in ms. */
  initialDelay?: number;
  /** Show a blinking caret while typing (hidden once typing completes). */
  showCursor?: boolean;
}

export default function TextType({
  text,
  className,
  typingSpeed = 55,
  initialDelay = 180,
  showCursor = true,
}: TextTypeProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        setRevealedCount((prev) => {
          const next = prev + 1;
          if (next >= text.length) {
            if (interval) clearInterval(interval);
            setDone(true);
          }
          return next;
        });
      }, typingSpeed);
    }, initialDelay);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [inView, reduceMotion, text, typingSpeed, initialDelay]);

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const revealed = inView ? revealedCount : 0;

  return (
    <span ref={containerRef} className={cn("relative inline-block", className)}>
      <span aria-hidden="true">
        {text.split("").map((char, i) => (
          <span key={i} style={{ opacity: i < revealed ? 1 : 0 }}>
            {char}
          </span>
        ))}
        {showCursor && (
          <span
            className={cn(
              "ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-current align-middle",
              done ? "opacity-0" : "animate-[blink_1s_step-end_infinite]",
            )}
          />
        )}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
