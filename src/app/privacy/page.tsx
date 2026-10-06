import type { Metadata } from 'next';
import { PrivacyView } from '@/views/legal';

export const metadata: Metadata = { title: 'Privacy — DOMINIC' };

export default function Page() {
  return <PrivacyView />;
}
