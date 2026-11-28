import { STATUS_LABELS, type CheckState } from '@/lib/engineering/types';

/** State is conveyed by text as well as colour (and the dot shape), never by colour alone. */
export default function StatusPill({ state, stale = false }: { state: CheckState | 'checking'; stale?: boolean }) {
  const label = state === 'checking' ? 'Checking' : STATUS_LABELS[state];
  return (
    <span className={`eng-pill eng-pill--${state}`}>
      <span className="eng-pill__dot" aria-hidden="true" />
      {label}
      {stale && state !== 'checking' && <span className="eng-pill__stale"> · Stale data</span>}
    </span>
  );
}
