'use client';

import type { ComponentProps, ComponentType } from 'react';
import { useIconTrigger } from '@/hooks/use-icon-trigger';

/** The part of an Animate UI icon this component relies on (all of them accept more). */
type AnimatedIcon = ComponentType<{ animate?: boolean; size?: number; className?: string; 'aria-hidden'?: boolean | 'true' }>;

/**
 * A link whose trailing Animate UI icon animates when the whole link is hovered or keyboard-focused.
 * The icon is decorative (the link text is the accessible name), so it is hidden from assistive tech.
 */
export default function IconLink({
  icon: Icon,
  iconSize = 16,
  className,
  children,
  ...props
}: ComponentProps<'a'> & { icon: AnimatedIcon; iconSize?: number }) {
  const { active, bind } = useIconTrigger();
  return (
    <a {...props} {...bind} className={`cta-icon-link${className ? ` ${className}` : ''}`}>
      {children}
      <Icon animate={active} size={iconSize} className="cta-icon" aria-hidden="true" />
    </a>
  );
}
