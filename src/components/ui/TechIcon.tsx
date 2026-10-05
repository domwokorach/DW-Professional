import { stackIcons } from '@/data';

/**
 * Decorative tech logo from the generated offline icon set; falls back to initials. `color` tints
 * single-colour icons (they draw in currentColor); multi-colour logos keep their own fills.
 */
export default function TechIcon({ icon, fallback, className, color, colorDark }: { icon: string; fallback: string; className: string; color?: string; colorDark?: string }) {
  const data = stackIcons[icon];
  if (!data) return <i className={`${className} tech-icon--fallback`} aria-hidden="true">{fallback.slice(0, 2)}</i>;
  return <svg className={`${className}${color ? ' tech-colored' : ''}`} style={color ? ({ '--tech-c': color, '--tech-c-dark': colorDark ?? color } as React.CSSProperties) : undefined} viewBox={data.viewBox} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: data.body }} />;
}
