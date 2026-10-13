'use client';

import type { ComponentProps, ComponentType } from 'react';
import { useIconTrigger } from '@/hooks/use-icon-trigger';

type AnimatedIcon = ComponentType<{ animate?: boolean; size?: number; className?: string; 'aria-hidden'?: boolean | 'true' }>;

export const RESUME_URL = 'https://drive.google.com/file/d/1ZNBJZ5OcnAUCvzmB7Nv_rF3SUF-f6c2F/view?usp=sharing';

/** The "Resume" call to action: opens the latest résumé on Google Drive in a new tab. */
export default function ResumeButton({
  icon: Icon, iconSize = 16, className, children, ...props
}: Omit<ComponentProps<'a'>, 'href' | 'target' | 'rel'> & { icon?: AnimatedIcon; iconSize?: number }) {
  const { active, bind } = useIconTrigger();
  return (
    <a {...props} {...(Icon ? bind : {})} href={RESUME_URL} target="_blank" rel="noopener noreferrer" className={`${Icon ? 'cta-icon-link ' : ''}rs-trigger${className ? ` ${className}` : ''}`}>
      {children}
      {Icon && <Icon animate={active} size={iconSize} className="cta-icon" aria-hidden="true" />}
    </a>
  );
}
