import type { Metadata } from 'next';
import { TermsView } from '@/views/legal';

export const metadata: Metadata = { title: 'Terms and Conditions — Dominic Olanya' };

export default function Page() {
  return <TermsView />;
}
