'use client';

import { CATEGORY_META, type GraphCategory } from './graph-data';

const FILTERABLE: GraphCategory[] = ['department', 'team', 'role', 'event', 'project'];

/** Category filters: unticked categories are hidden; node positions stay fixed. */
export default function GraphFilters({ hidden, onToggle }: { hidden: ReadonlySet<GraphCategory>; onToggle: (c: GraphCategory) => void }) {
  return (
    <fieldset className="ig-filters">
      <legend className="sr-only">Show categories</legend>
      {FILTERABLE.map((c) => (
        <label key={c} className="ig-check">
          <input type="checkbox" checked={!hidden.has(c)} onChange={() => onToggle(c)} />
          <span className="ig-dot" style={{ background: CATEGORY_META[c].colour }} aria-hidden="true" />
          {CATEGORY_META[c].plural}
        </label>
      ))}
    </fieldset>
  );
}
