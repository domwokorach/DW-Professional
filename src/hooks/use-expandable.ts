"use client";

import { useEffect, useId, useState } from "react";

export type ResponsiveCount = {
  /** Visible items below the `sm` breakpoint (mobile). */
  base: number;
  /** Visible items from the `sm` breakpoint (tablet). */
  sm?: number;
  /** Visible items from the `md` breakpoint (laptop). */
  md?: number;
  /** Visible items from the `lg` breakpoint (desktop). */
  lg?: number;
};

function resolveCount(count: number | ResponsiveCount, width: number | null): number {
  if (typeof count === "number") return count;
  if (width === null) return count.base;
  if (width >= 1024 && count.lg != null) return count.lg;
  if (width >= 768 && count.md != null) return count.md;
  if (width >= 640 && count.sm != null) return count.sm;
  return count.base;
}

function useResponsiveCount(count: number | ResponsiveCount): number {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return resolveCount(count, width);
}

/**
 * Shared Show More / Show Less state for a list-shaped section.
 *
 * Renders as many `items` as the current viewport's initial count allows,
 * then reveals the rest on demand. The caller keeps full control of how each
 * item is rendered (grid, card component, animation) — this hook just owns
 * the compact/expanded state, the accessible `listId`, and which slice of
 * `items` is currently visible.
 */
export function useExpandable<T>(items: readonly T[], initialVisibleCount: number | ResponsiveCount) {
  const baseVisible = useResponsiveCount(initialVisibleCount);
  const [expanded, setExpanded] = useState(false);
  const listId = useId();

  const clampedBase = Math.min(baseVisible, items.length);
  const hasMore = items.length > clampedBase;
  const visibleItems = expanded ? items : items.slice(0, clampedBase);

  const toggle = () => setExpanded((current) => !current);

  return { visibleItems, hasMore, expanded, toggle, listId, visibleCount: clampedBase };
}
