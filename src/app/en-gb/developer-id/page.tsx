import type { Metadata, Viewport } from 'next';
import { DeveloperIdView } from '@/views/developer-id';

const PATH = '/en-gb/developer-id';
const TITLE = 'Developer ID | Dominic Wokorach';
const DESCRIPTION = "Dominic Wokorach's Developer ID: a digital identity card for a London-based Software Engineer & Frontend Developer. Flip it over, or scan the QR code to send an email.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: 'website' },
};

// The page pads itself with the safe-area insets (developer-id.css); viewport-fit=cover makes them available.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function Page() {
  return <DeveloperIdView />;
}
