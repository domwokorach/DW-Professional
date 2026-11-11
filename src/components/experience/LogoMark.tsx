'use client';

import { CalendarDays, Globe } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type Props = { logo?: { src: string; alt: string }; mark?: string; icon?: 'calendar' | 'globe' };

/** Company logo at 50 × 50; falls back to the text monogram if the image is missing or fails to load. */
export default function LogoMark({ logo, mark, icon }: Props) {
  const [failed, setFailed] = useState(false);
  if (logo && !failed) {
    return (
      <span className="xp-mark xp-mark--logo">
        <Image src={logo.src} alt={logo.alt} width={50} height={50} onError={() => setFailed(true)} />
      </span>
    );
  }
  if (icon) return <span className="xp-mark" aria-hidden="true">{icon === 'globe' ? <Globe size={22} strokeWidth={1.8} /> : <CalendarDays size={22} strokeWidth={1.8} />}</span>;
  return mark ? <span className="xp-mark" aria-hidden="true">{mark}</span> : null;
}
