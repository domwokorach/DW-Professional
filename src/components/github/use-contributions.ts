'use client';

import { useEffect, useState } from 'react';
import { fetchContributions } from '@/lib/github/client';
import type { ContributionsErrorCode, ContributionsPayload } from '@/lib/github/types';

export type ContributionsState =
  | { status: 'loading'; data: ContributionsPayload | null }
  | { status: 'ready'; data: ContributionsPayload }
  | { status: 'error'; data: ContributionsPayload | null; code: ContributionsErrorCode | 'network'; retry: () => void };

/** Fresh periods, kept for the session so flipping back to a year is instant. */
const memo = new Map<string, ContributionsPayload>();
const keyOf = (year: number | null) => (year === null ? 'rolling' : String(year));

/**
 * Contributions for the rolling year (null) or a calendar year. While another period loads, `data` keeps the one on
 * screen so the calendar can dim in place instead of collapsing to a skeleton (no layout shift).
 */
export function useContributions(year: number | null, origin = ''): ContributionsState {
  const key = keyOf(year);
  const [loaded, setLoaded] = useState<{ key: string; data: ContributionsPayload } | null>(null);
  const [failure, setFailure] = useState<{ key: string; code: ContributionsErrorCode | 'network' } | null>(null);
  const [shown, setShown] = useState<ContributionsPayload | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = () => { setFailure(null); setAttempt((n) => n + 1); };

  const current = memo.get(key) ?? (loaded?.key === key ? loaded.data : null);
  // Remember what is on screen (set during render, guarded, as React documents for derived state).
  if (current && current !== shown) setShown(current);

  useEffect(() => {
    if (memo.has(key) && attempt === 0) return;
    const controller = new AbortController();
    fetchContributions(year, { origin, signal: controller.signal }).then((result) => {
      if (result.ok) {
        // A stale copy is shown but not remembered, so the next visit asks the server again.
        if (!result.data.stale) memo.set(key, result.data);
        setLoaded({ key, data: result.data });
        setFailure(null);
      } else setFailure({ key, code: result.code });
    }).catch(() => undefined);
    return () => controller.abort();
  }, [key, year, origin, attempt]);

  if (current) return { status: 'ready', data: current };
  if (failure?.key === key) return { status: 'error', data: shown, code: failure.code, retry };
  return { status: 'loading', data: shown };
}
