"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function TrueFocus({
  sentence,
  className,
  blurAmount = 6,
  borderColor = "#5b8def",
  glowColor = "rgba(91, 141, 239, 0.55)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1.4,
}: {
  sentence: string;
  className?: string;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}) {
  const words = sentence.split(" ");
  const containerRef = useRef<HTMLHeadingElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [inView, setInView] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focusRect, setFocusRect] = useState<FocusRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [frameVisible, setFrameVisible] = useState(false);
  const reduceMotion = useReducedMotion();

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
    setFrameVisible(true);
    if (currentIndex >= words.length - 1) {
      const hideTimer = setTimeout(
        () => setFrameVisible(false),
        (animationDuration + pauseBetweenAnimations) * 1000,
      );
      return () => clearTimeout(hideTimer);
    }
    const timer = setTimeout(
      () => setCurrentIndex((prev) => prev + 1),
      (animationDuration + pauseBetweenAnimations) * 1000,
    );
    return () => clearTimeout(timer);
  }, [
    inView,
    currentIndex,
    words.length,
    animationDuration,
    pauseBetweenAnimations,
    reduceMotion,
  ]);

  useEffect(() => {
    const parent = containerRef.current;
    const activeWord = wordRefs.current[currentIndex];
    if (!parent || !activeWord) return;
    const parentRect = parent.getBoundingClientRect();
    const wordRect = activeWord.getBoundingClientRect();
    setFocusRect({
      x: wordRect.left - parentRect.left,
      y: wordRect.top - parentRect.top,
      width: wordRect.width,
      height: wordRect.height,
    });
  }, [currentIndex, inView]);

  if (reduceMotion) {
    return <span className={className}>{sentence}</span>;
  }

  return (
    <span
      ref={containerRef}
      className={cn(
        "relative inline-flex flex-wrap gap-x-3 gap-y-1",
        className,
      )}
    >
      {words.map((word, index) => {
        const isActive = inView && index <= currentIndex;
        return (
          <span
            key={`${word}-${index}`}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className="inline-block"
            style={{
              filter: isActive ? "blur(0px)" : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.35,
              transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
            }}
          >
            {word}
          </span>
        );
      })}

      <motion.span
        aria-hidden
        className="pointer-events-none absolute rounded-md"
        initial={false}
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: frameVisible && focusRect.width > 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration, ease: "easeOut" }}
        style={{ boxShadow: `0 0 16px ${glowColor}` }}
      >
        <span
          className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-tl border-l-2 border-t-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-tr border-r-2 border-t-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-bl border-b-2 border-l-2"
          style={{ borderColor }}
        />
        <span
          className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-br border-b-2 border-r-2"
          style={{ borderColor }}
        />
      </motion.span>
    </span>
  );
}
