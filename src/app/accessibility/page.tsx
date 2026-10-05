import type { Metadata } from 'next';
import { AccessibilityView } from '@/views/legal';

export const metadata: Metadata = { title: 'Accessibility and Disability — DOMINIC WOKORACH OLANYA' };

export default function Page() {
  return <AccessibilityView />;
}
