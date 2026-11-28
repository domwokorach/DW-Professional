'use client';

import { useEffect, useState } from 'react';
import type { EngineeringStatus } from '@/lib/engineering/types';

export type StatusState = { phase: 'loading' } | { phase: 'ready'; data: EngineeringStatus } | { phase: 'error' };

/** Reads the server-side status route once. `origin` is '' on the website and the site origin in the Expo web build. */
export function useEngineeringStatus(origin = ''): StatusState {
  const [state, setState] = useState<StatusState>({ phase: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${origin}/api/engineering/status`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<EngineeringStatus>) : Promise.reject(new Error('status'))))
      .then((data) => setState({ phase: 'ready', data }))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) setState({ phase: 'error' }); });
    return () => controller.abort();
  }, [origin]);
  return state;
}
