declare module '*.css';
declare module '*.module.css' { const classes: Record<string, string>; export default classes; }

// Next.js extends fetch's options; the website's server modules type-check against this when pulled in through barrels.
interface RequestInit { next?: { revalidate?: number | false; tags?: string[] } }
