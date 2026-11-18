import type { AnchorHTMLAttributes } from 'react';

const SITE = process.env.EXPO_PUBLIC_SITE_URL || 'https://www.dominicwokorach.me';

/** Browser replacement for next/link. The portfolio home stays in this app; other site pages (legal etc.) open on the website. */
export default function Link({ href, prefetch: _p, replace: _r, scroll: _s, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean }) {
  const target = href === '/en-gb' ? '/' : href.startsWith('/') ? `${SITE}${href}` : href;
  return <a {...rest} href={target} />;
}
