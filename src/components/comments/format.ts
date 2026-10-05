const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "5 Oct 2026" */
export const formatCommentDate = (iso: string) => DATE.format(new Date(iso));

/** Up to two initials, for the avatar fallback. */
export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => Array.from(w)[0]?.toUpperCase() ?? '').join('') || '?';
