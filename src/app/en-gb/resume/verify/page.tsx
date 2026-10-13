import type { Metadata, Viewport } from 'next';
import ResumeVerifyView from '@/views/resume/ResumeVerifyView';

// Reached only from the verification email, not something to find in search (and the link must never be cached or shared).
export const metadata: Metadata = {
  title: 'Verify your email — DOMINIC',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function Page() {
  return <ResumeVerifyView />;
}
