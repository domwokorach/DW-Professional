"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Magic UI-style terminal primitives, adapted for this portfolio.
 *
 * `Terminal` runs a strict sequential queue: each `TypingAnimation` /
 * `AnimatedSpan` child only starts once the previous child has finished, and
 * the whole sequence starts once, the first time the terminal scrolls into
 * view. `prefers-reduced-motion` skips the animation entirely and reveals
 * the full transcript immediately.
 */

interface TerminalSequenceState {
  started: boolean;
  activeIndex: number;
  reduceMotion: boolean;
  advance: () => void;
}

const TerminalSequenceContext = React.createContext<TerminalSequenceState | null>(null);

function useTerminalSequence() {
  return React.useContext(TerminalSequenceContext);
}

export interface TerminalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: React.ReactNode;
  /** Run children one after another rather than all at once. Default true. */
  sequence?: boolean;
  /** Only start once the terminal enters the viewport. Default true. */
  startOnView?: boolean;
}

export function Terminal({
  children,
  className,
  sequence = true,
  startOnView = true,
  ...props
}: TerminalProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.3 });
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const started = reduceMotion || !startOnView || inView;

  const advance = React.useCallback(() => {
    setActiveIndex((i) => i + 1);
  }, []);

  const items = React.useMemo(() => React.Children.toArray(children), [children]);

  const contextValue = React.useMemo<TerminalSequenceState>(
    () => ({
      started,
      activeIndex: reduceMotion ? items.length : activeIndex,
      reduceMotion: !!reduceMotion,
      advance,
    }),
    [started, activeIndex, reduceMotion, advance, items.length]
  );

  return (
    <div ref={containerRef} className={cn("font-mono", className)} {...props}>
      <TerminalSequenceContext.Provider value={contextValue}>
        {sequence
          ? items.map((child, index) =>
              React.isValidElement(child)
                ? React.cloneElement(
                    child as React.ReactElement<{ __index?: number }>,
                    { key: child.key ?? index, __index: index }
                  )
                : child
            )
          : children}
      </TerminalSequenceContext.Provider>
    </div>
  );
}

function usePrefixedPrompt(text: string) {
  return React.useMemo(() => {
    const match = text.match(/^(\$\s)/);
    if (!match) return text;
    return (
      <>
        <span className="text-accent/70">{match[1]}</span>
        {text.slice(match[1].length)}
      </>
    );
  }, [text]);
}

export interface TypingAnimationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children: string;
  /** Milliseconds per character. */
  duration?: number;
  /** Milliseconds to wait, once it is this item's turn, before typing starts. */
  delay?: number;
  /** @internal injected by <Terminal> */
  __index?: number;
}

export function TypingAnimation({
  children,
  className,
  duration = 26,
  delay = 60,
  __index = 0,
  ...props
}: TypingAnimationProps) {
  const ctx = useTerminalSequence();
  const [displayed, setDisplayed] = React.useState(ctx ? "" : children);
  const hasRunRef = React.useRef(false);
  const timers = React.useRef<{
    timeout?: ReturnType<typeof setTimeout>;
    interval?: ReturnType<typeof setInterval>;
  }>({});

  const isTurn = !ctx || ctx.activeIndex === __index;
  const started = !ctx || ctx.started;

  React.useEffect(() => {
    if (!ctx) return;

    if (ctx.reduceMotion) {
      setDisplayed(children);
      if (!hasRunRef.current) {
        hasRunRef.current = true;
        ctx.advance();
      }
      return;
    }

    if (!started || !isTurn || hasRunRef.current) return;
    hasRunRef.current = true;

    const handles = timers.current;
    let i = 0;
    handles.timeout = setTimeout(() => {
      handles.interval = setInterval(() => {
        i += 1;
        setDisplayed(children.slice(0, i));
        if (i >= children.length) {
          if (handles.interval) clearInterval(handles.interval);
          ctx.advance();
        }
      }, duration);
    }, delay);

    return () => {
      if (handles.timeout) clearTimeout(handles.timeout);
      if (handles.interval) clearInterval(handles.interval);
    };
  }, [ctx, started, isTurn, children, delay, duration]);

  const complete = displayed.length >= children.length;
  const showCursor = started && isTurn && !complete && !ctx?.reduceMotion;
  const prompt = usePrefixedPrompt(displayed);

  return (
    <div className={cn("text-white", className)} {...props}>
      {prompt}
      {showCursor && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] animate-pulse bg-white/70 align-middle"
        />
      )}
    </div>
  );
}

export interface AnimatedSpanProps {
  className?: string;
  children: React.ReactNode;
  /** Milliseconds to wait, once it is this item's turn, before fading in. */
  delay?: number;
  /** Fade-in duration in milliseconds. */
  duration?: number;
  /** @internal injected by <Terminal> */
  __index?: number;
}

export function AnimatedSpan({
  children,
  className,
  delay = 40,
  duration = 260,
  __index = 0,
}: AnimatedSpanProps) {
  const ctx = useTerminalSequence();
  const [visible, setVisible] = React.useState(!ctx);
  const hasRunRef = React.useRef(false);
  const timers = React.useRef<{
    delay?: ReturnType<typeof setTimeout>;
    settle?: ReturnType<typeof setTimeout>;
  }>({});

  const isTurn = !ctx || ctx.activeIndex === __index;
  const started = !ctx || ctx.started;

  React.useEffect(() => {
    if (!ctx) return;

    if (ctx.reduceMotion) {
      setVisible(true);
      if (!hasRunRef.current) {
        hasRunRef.current = true;
        ctx.advance();
      }
      return;
    }

    if (!started || !isTurn || hasRunRef.current) return;
    hasRunRef.current = true;

    const handles = timers.current;
    handles.delay = setTimeout(() => {
      setVisible(true);
      handles.settle = setTimeout(() => ctx.advance(), duration);
    }, delay);

    return () => {
      if (handles.delay) clearTimeout(handles.delay);
      if (handles.settle) clearTimeout(handles.settle);
    };
  }, [ctx, started, isTurn, delay, duration]);

  return (
    <motion.div
      initial={ctx ? { opacity: 0, y: -4 } : false}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: duration / 1000, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
