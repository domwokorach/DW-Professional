import type { Metadata, Viewport } from 'next';
import { DEVELOPER_ID_SCAN_PATH } from '@/config';
import { DeveloperIdScanView } from '@/views/developer-id';

const TITLE = 'Developer ID scan | Dominic Wokorach';

// A utility landing page for the QR code: keep it out of search results.
export const metadata: Metadata = {
  title: TITLE,
  description: 'Opened from the Developer ID QR code. Email Dominic Wokorach Olanya.',
  alternates: { canonical: DEVELOPER_ID_SCAN_PATH },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function Page() {
  return <DeveloperIdScanView />;
}
