'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContributionData, ContributionErrorCode, ContributionResponse } from '@/lib/github-contributions';

export type ContributionState =
  | { status: 'loading' }
  | { status: 'ready'; data: ContributionData; stale: boolean }
  | { status: 'error'; error: ContributionErrorCode };

const PATH = '/api/github/contributions';

/** Loads the contribution calendar for a year (or 'rolling') from the site's own endpoint, caching each period in memory. */
/** `apiOrigin` is empty on the website (same origin); the Expo web build passes the site's absolute origin. */
export function useContributions(period: string, apiOrigin = '') {
  const ENDPOINT = `${apiOrigin}${PATH}`;
  const [state, setState] = useState<ContributionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const cache = useRef(new Map<string, { data: ContributionData; stale: boolean }>());

  useEffect(() => {
    const hit = cache.current.get(period);
    if (hit) {
      setState({ status: 'ready', ...hit });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    (async () => {
      try {
        const res = await fetch(period === 'rolling' ? ENDPOINT : `${ENDPOINT}?year=${period}`, { signal: controller.signal });
        const body = (await res.json()) as ContributionResponse;
        if (body.data) {
          const entry = { data: body.data, stale: Boolean(body.stale) };
          if (!entry.stale) cache.current.set(period, entry);
          setState({ status: 'ready', ...entry });
        } else setState({ status: 'error', error: body.error ?? 'unavailable' });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error', error: 'unavailable' });
      }
    })();
    return () => controller.abort();
  }, [period, attempt, ENDPOINT]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
