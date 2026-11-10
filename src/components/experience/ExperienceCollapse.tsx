'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/** Disclosure whose content stays in the DOM (server-rendered, crawlable) while collapsed. */
export default function ExperienceCollapse({ id, label, name, defaultOpen = false, children }: {
  id: string;
  label: string;
  /** What the disclosure belongs to, so each button has a unique accessible name. */
  name: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="xp-collapse" data-open={open}>
      <button type="button" className="xp-toggle" aria-expanded={open} aria-controls={id} aria-label={`${label}: ${name}`} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span>
        <ChevronDown aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>
      <div id={id} className="xp-collapse__panel" inert={!open}>
        <div className="xp-collapse__inner">{children}</div>
      </div>
    </div>
  );
}
