import type { Metadata, Viewport } from 'next';
import '@/styles/admin.css';

// The admin area is private: never indexed, never cached (see also src/middleware.ts).
export const metadata: Metadata = {
  title: 'Admin · DOMINIC',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';
// viewport-fit=cover makes the safe-area insets (notch, rounded corners, home indicator) available to the CSS, which
// pads the admin shell with them (admin.css). Scoped to the admin area, so the public site's layout is unchanged.
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
