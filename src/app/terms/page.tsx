import type { Metadata } from 'next';
import { TermsView } from '@/views/legal';

export const metadata: Metadata = { title: 'Terms and Conditions — DOMINIC' };

export default function Page() {
  return <TermsView />;
}
