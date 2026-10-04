import type { Metadata } from 'next';
import { CookieView } from '@/views/legal';

export const metadata: Metadata = { title: 'Cookie Policy — Dominic Olanya' };

export default function Page() {
  return <CookieView />;
}
