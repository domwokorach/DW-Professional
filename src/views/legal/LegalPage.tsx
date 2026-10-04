import Link from 'next/link';
import type { ReactNode } from 'react';
import { HOME, legal } from '@/config';

/** Shared shell for the legal pages: simple header, readable article column, last-updated line. */
export default function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="legal-header">
        <Link href={HOME} className="legal-header__brand"><span>DO</span><b>Dominic Olanya</b></Link>
        <Link href={HOME} className="legal-header__back">← Back to portfolio</Link>
      </header>
      <main className="legal-page">
        <article className="legal-article">
          <p className="legal-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-updated">Last updated {legal.lastUpdated}</p>
          {children}
        </article>
      </main>
    </>
  );
}

/** Marks an operational fact that the site owner still needs to fill in (see src/config/legal.ts). */
export function ToConfirm({ value, what }: { value: string | null; what: string }) {
  return value ? <>{value}</> : <span className="legal-tbc">{what} — to be confirmed</span>;
}
