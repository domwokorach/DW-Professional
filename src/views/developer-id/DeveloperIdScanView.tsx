import Link from 'next/link';
import { HOME } from '@/config';
import { BackgroundOrbs, ThemeToggle } from '@/components/layout';
import { DeveloperIdCard, ScanConfirmation } from '@/components/developer-id';

/** Where the Developer ID QR code lands: the card behind a "Scan Successful" confirmation with an Email Dominic action. */
export default function DeveloperIdScanView() {
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
      <ScanConfirmation />
    </>
  );
}
