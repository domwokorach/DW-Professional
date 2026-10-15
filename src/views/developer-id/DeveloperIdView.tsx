import Link from 'next/link';
import { HOME } from '@/config';
import { BackgroundOrbs, ThemeToggle } from '@/components/layout';
import { DeveloperIdCard } from '@/components/developer-id';

/** Standalone page for the Developer ID card (the same card as the homepage's About section). */
export default function DeveloperIdView() {
  return (
    <>
      <BackgroundOrbs />
      <header className="legal-header">
        <Link href={HOME} className="legal-header__brand"><span>DO</span><b>DOMINIC</b></Link>
        <div className="legal-header__end">
          <Link href={HOME} className="legal-header__back">← Back to portfolio</Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="dev-id-page">
        <h1 className="sr-only">Developer ID</h1>
        <DeveloperIdCard standalone />
      </main>
    </>
  );
}
