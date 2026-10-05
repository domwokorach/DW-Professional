/**
 * Joins class names, skipping anything that isn't a non-empty string. The shadcn-style `cn()` that generated
 * components import (it also receives motion's `className` values, which can be non-strings).
 */
export function cn(...classes: unknown[]): string {
  return classes.filter((c): c is string => typeof c === 'string' && c !== '').join(' ');
}
