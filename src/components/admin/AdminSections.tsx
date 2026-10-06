import Link from 'next/link';

const SECTIONS = [
  { href: '/admin/comments', label: 'Comments' },
  { href: '/admin/sessions', label: 'Sessions' },
] as const;

/** Links between the admin sections; the current one is marked for assistive technology and styled as selected. */
export default function AdminSections({ current }: { current: (typeof SECTIONS)[number]['href'] }) {
  // A session's detail page (/admin/sessions/…) counts as Sessions.
  return (
    <nav className="adm-sections" aria-label="Admin sections">
      {SECTIONS.map((s) => (
        <Link key={s.href} href={s.href} className="adm-section" aria-current={s.href === current ? 'page' : undefined}>
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
