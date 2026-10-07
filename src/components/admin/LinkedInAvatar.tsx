'use client';

import { useState } from 'react';

/** LinkedIn profile photo for the session page. LinkedIn's image URLs expire, so a failed load falls back to a badge. */
export default function LinkedInAvatar({ src, name }: { src: string | null; name: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => Array.from(w)[0]?.toUpperCase()).join('') || 'in';
  if (!src || failed) return <span className="adm-li__avatar adm-li__avatar--none" aria-hidden="true">{initials}</span>;
  // LinkedIn's image host; no referrer is sent.
  return <img className="adm-li__avatar" src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
