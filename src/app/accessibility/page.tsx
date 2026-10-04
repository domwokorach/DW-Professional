import type { Metadata } from 'next';
import { AccessibilityView } from '@/views/legal';

export const metadata: Metadata = { title: 'Accessibility and Disability — Dominic Olanya' };

export default function Page() {
  return <AccessibilityView />;
}
