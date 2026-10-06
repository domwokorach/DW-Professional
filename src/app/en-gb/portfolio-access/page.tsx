import type { Metadata } from 'next';
import { PortfolioAccessView } from '@/views/portfolio-access';

// A destination for people who scan the QR code on the Developer ID card, not something to find in search.
export const metadata: Metadata = {
  title: 'Portfolio Access — DOMINIC',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortfolioAccessView />;
}
