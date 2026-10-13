'use client';

import { useState, type ComponentProps, type ComponentType } from 'react';
import { useIconTrigger } from '@/hooks/use-icon-trigger';
import ResumeDialog from './ResumeDialog';

type AnimatedIcon = ComponentType<{ animate?: boolean; size?: number; className?: string; 'aria-hidden'?: boolean | 'true' }>;

/**
 * The "Resume" call to action. It looks like the link it replaces (same classes and icon), but opens the email
 * verification dialog instead of linking to a public file.
 */
export default function ResumeButton({
  icon: Icon, iconSize = 16, className, children, ...props
}: Omit<ComponentProps<'button'>, 'onClick' | 'type'> & { icon?: AnimatedIcon; iconSize?: number }) {
  const [open, setOpen] = useState(false);
  const { active, bind } = useIconTrigger();
  return (
    <>
      <button {...props} {...(Icon ? bind : {})} type="button" aria-haspopup="dialog" className={`${Icon ? 'cta-icon-link ' : ''}rs-trigger${className ? ` ${className}` : ''}`} onClick={() => setOpen(true)}>
        {children}
        {Icon && <Icon animate={active} size={iconSize} className="cta-icon" aria-hidden="true" />}
      </button>
      <ResumeDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
