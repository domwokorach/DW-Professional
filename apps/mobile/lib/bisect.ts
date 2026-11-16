/**
 * Launch-crash isolation switch, read at bundle time from EXPO_PUBLIC_BISECT (restart Metro with `-c` after changing it).
 *  0  bare screen, no providers        3  every section, no floating nav
 *  1  providers (theme, toasts) only   4+ the full app (default when unset)
 *  2  Home section only, no nav
 */
export const BISECT = Number(process.env.EXPO_PUBLIC_BISECT ?? 99);
