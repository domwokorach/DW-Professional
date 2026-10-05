/** Joins class names, skipping falsy values. The shadcn-style `cn()` that generated components import. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
