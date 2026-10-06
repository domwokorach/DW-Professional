import type { Metadata } from 'next';
import { CookieView } from '@/views/legal';

export const metadata: Metadata = { title: 'Cookie Policy — DOMINIC' };

export default function Page() {
  return <CookieView />;
}
