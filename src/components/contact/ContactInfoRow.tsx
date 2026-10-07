'use client';

import type { ComponentType, ReactNode, Ref } from 'react';
import { AtSignIcon } from '@/components/ui/at-sign';
import { BriefcaseBusinessIcon } from '@/components/ui/briefcase-business';
import { MapPinIcon } from '@/components/ui/map-pin';
import { useIconHandle, type IconHandle } from '@/hooks/use-icon-handle';

type AnimatedIcon = ComponentType<{ ref?: Ref<IconHandle>; size?: number; className?: string; 'aria-hidden'?: boolean | 'true' }>;

/** Animated Lucide icons by row label. A label without one shows `icon`, the static icon rendered by the (server) parent. */
const ICONS: Record<string, AnimatedIcon> = {
  Email: AtSignIcon as AnimatedIcon,
  Location: MapPinIcon as AnimatedIcon,
  Work: BriefcaseBusinessIcon as AnimatedIcon,
};

/**
 * One row of the contact details (icon, label, value). The icon animates when the whole row is hovered or its link is
 * keyboard-focused (and plays briefly on a tap), not only when the icon itself is touched, and never under
 * prefers-reduced-motion. The icon is decorative: the label and value carry the meaning.
 */
export default function ContactInfoRow({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  const { ref, bind } = useIconHandle();
  const Icon = ICONS[label];
  return (
    <div className="contact-info__row" {...bind}>
      {Icon
        ? <Icon ref={ref} size={18} className="contact-info__icon" aria-hidden="true" />
        : icon}
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
