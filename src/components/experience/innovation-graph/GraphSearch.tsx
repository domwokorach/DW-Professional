'use client';

import { Search, X } from 'lucide-react';

/** Search by department, team, role or activity name. */
export default function GraphSearch({ value, onChange, count }: { value: string; onChange: (v: string) => void; count: number | null }) {
  return (
    <div className="ig-search" role="search">
      <Search aria-hidden="true" size={16} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search departments, teams or roles" aria-label="Search the graph by department, team or role" />
      {value && (
        <button type="button" className="ig-search__clear" onClick={() => onChange('')} aria-label="Clear search"><X aria-hidden="true" size={14} /></button>
      )}
      <span className="sr-only" role="status">{count === null ? '' : `${count} matching ${count === 1 ? 'entity' : 'entities'}`}</span>
    </div>
  );
}
