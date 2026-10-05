import type { Metadata } from 'next';
import '@/styles/admin.css';

// The admin area is private: never indexed, never cached (see also src/middleware.ts).
export const metadata: Metadata = {
  title: 'Admin · DOMINIC WOKORACH OLANYA',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
