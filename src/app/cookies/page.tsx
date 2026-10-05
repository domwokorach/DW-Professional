import type { Metadata } from 'next';
import { CookieView } from '@/views/legal';

export const metadata: Metadata = { title: 'Cookie Policy — DOMINIC WOKORACH OLANYA' };

export default function Page() {
  return <CookieView />;
}
