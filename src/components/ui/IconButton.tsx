'use client';

import type { ComponentProps, ForwardRefExoticComponent, RefAttributes } from 'react';
import { useIconHandle, type IconHandle } from '@/composables/useIconHandle';

type LucideAnimatedIcon = ForwardRefExoticComponent<
  { size?: number; className?: string; 'aria-hidden'?: boolean | 'true' } & RefAttributes<IconHandle>
>;

/**
 * A button whose trailing Lucide Animated icon animates when the whole button is hovered, keyboard-focused
 * or tapped. The icon is decorative (the label is the accessible name), so it is hidden from assistive tech.
 * (The library renders the icon inside a div; it is styled inline so the button lays out as before.)
 */
export default function IconButton({
  icon: Icon,
  iconSize = 18,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { icon: LucideAnimatedIcon; iconSize?: number }) {
  const { ref, bind } = useIconHandle();
  return (
    <button type="button" {...props} {...bind} className={`cta-icon-link${className ? ` ${className}` : ''}`}>
      {children}
      <Icon ref={ref} size={iconSize} className="cta-icon cta-icon--lucide" aria-hidden="true" />
    </button>
  );
}
