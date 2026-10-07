import type { Metadata, Viewport } from 'next';
import { PortfolioAccessView } from '@/views/portfolio-access';

// A destination for people who scan the QR code on the Developer ID card, not something to find in search.
export const metadata: Metadata = {
  title: 'Portfolio Access — DOMINIC',
  robots: { index: false, follow: false },
};

// The page pads itself with the safe-area insets (portfolio-access.css); viewport-fit=cover makes them available.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function Page() {
  return <PortfolioAccessView />;
}
