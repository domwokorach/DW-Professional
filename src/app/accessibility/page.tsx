import type { Metadata } from 'next';
import { AccessibilityView } from '@/views/legal';

export const metadata: Metadata = { title: 'Accessibility and Disability — DOMINIC' };

export default function Page() {
  return <AccessibilityView />;
}
