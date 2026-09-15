"use client";

import type React from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface LogoItem {
  /** The label text displayed next to the icon */
  label: string;
  /** The icon element to render (e.g. a react-icons or lucide-react component instance) */
  icon: React.ReactNode;
  /** Animation delay in seconds (use negative values for a staggered start) */
  animationDelay: number;
  /** Animation duration in seconds */
  animationDuration: number;
  /** The row number where this logo should appear (1-based) */
  row: number;
}

export interface LogoTimelineProps {
  /** Array of logo items to display */
  items: LogoItem[];
  /** Optional title text to display faintly behind the rows */
  title?: string;
  /** Height of the timeline container */
  height?: string;
  /** Additional className for the container */
  className?: string;
  /** Whether to show separator lines between rows (default: true) */
  showRowSeparator?: boolean;
  /** Whether to animate logos only on hover (default: false) */
  animateOnHover?: boolean;
}

export function LogoTimeline({
  items,
  title,
  height = "h-[420px]",
  className,
  showRowSeparator = true,
  animateOnHover = false,
}: LogoTimelineProps) {
  const [isHovered, setIsHovered] = useState(false);

  const rowsMap = new Map<number, LogoItem[]>();
  items.forEach((item) => {
    if (!rowsMap.has(item.row)) {
      rowsMap.set(item.row, []);
    }
    rowsMap.get(item.row)?.push(item);
  });

  const rows = Array.from(rowsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, rowItems]) => rowItems);

  const animationPlayState = animateOnHover ? (isHovered ? "running" : "paused") : "running";

  return (
    <section className={cn("w-full", height, className)}>
      <div
        aria-hidden="true"
        className="relative h-full w-full overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        onMouseEnter={() => animateOnHover && setIsHovered(true)}
        onMouseLeave={() => animateOnHover && setIsHovered(false)}
      >
        {title && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="mx-auto max-w-3xl px-6 text-center text-3xl font-semibold tracking-tight text-white/[0.05] sm:text-5xl md:text-6xl">
              {title}
            </p>
          </div>
        )}
        <div
          className="absolute inset-0 grid [container-type:inline-size]"
          style={{ gridTemplateRows: `repeat(${rows.length}, 1fr)` }}
        >
          {rows.map((rowItems, index) => (
            <div className="group relative flex items-center" key={index}>
              <div className="absolute inset-x-0 top-1/2 border-t border-line" />
              {showRowSeparator && (
                <div className="absolute inset-x-0 bottom-0 border-b border-white/5 group-last:hidden" />
              )}
              {rowItems.map((logo) => (
                <div
                  key={`${logo.row}-${logo.label}`}
                  className={cn(
                    "absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/80 shadow-[0_0_20px_rgba(0,0,0,0.25)] backdrop-blur-sm",
                    "[--move-x-from:-100%] [--move-x-to:calc(100%+100cqw)] [animation-duration:var(--duration)] [animation-iteration-count:infinite] [animation-name:move-x] [animation-timing-function:linear]"
                  )}
                  style={
                    {
                      animationDelay: `${logo.animationDelay}s`,
                      animationPlayState,
                      "--duration": `${logo.animationDuration}s`,
                    } as React.CSSProperties
                  }
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center text-white/70 [&>svg]:h-full [&>svg]:w-full">
                    {logo.icon}
                  </span>
                  <span className="text-sm font-medium">{logo.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
