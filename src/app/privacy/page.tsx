import type { Metadata } from 'next';
import { PrivacyView } from '@/views/legal';

export const metadata: Metadata = { title: 'Privacy — Dominic Olanya' };

export default function Page() {
  return <PrivacyView />;
}
