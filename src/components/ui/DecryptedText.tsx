"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface DecryptedTextProps {
  text: string;
  className?: string;
  /** Characters used while a position is still scrambling. */
  charset?: string;
  /** Ms between scramble character swaps. */
  speed?: number;
  /** Ms between each character locking into its final value. */
  revealDelay?: number;
  /** Delay before the animation starts, in ms. */
  startDelay?: number;
}

export default function DecryptedText({
  text,
  className,
  charset = DEFAULT_CHARSET,
  speed = 35,
  revealDelay = 28,
  startDelay = 0,
}: DecryptedTextProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(text);

  const scrambleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(text);
      return;
    }

    const randomChar = () =>
      charset[Math.floor(Math.random() * charset.length)];

    const clearAll = () => {
      if (scrambleTimer.current) clearInterval(scrambleTimer.current);
      if (revealTimer.current) clearInterval(revealTimer.current);
      if (startTimer.current) clearTimeout(startTimer.current);
    };

    clearAll();

    startTimer.current = setTimeout(() => {
      let revealedCount = 0;
      const total = text.length;

      scrambleTimer.current = setInterval(() => {
        setDisplay(
          text
            .split("")
            .map((ch, i) => {
              if (i < revealedCount) return ch;
              return ch === " " ? " " : randomChar();
            })
            .join("")
        );
      }, speed);

      revealTimer.current = setInterval(() => {
        revealedCount += 1;
        if (revealedCount >= total) {
          if (revealTimer.current) clearInterval(revealTimer.current);
          if (scrambleTimer.current) clearInterval(scrambleTimer.current);
          setDisplay(text);
        }
      }, revealDelay);
    }, startDelay);

    return clearAll;
  }, [text, charset, speed, revealDelay, startDelay, reduceMotion]);

  return (
    <span className={cn("inline-block", className)}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
