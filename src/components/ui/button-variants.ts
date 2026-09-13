import { cva } from "class-variance-authority";

/**
 * Shared class-variance-authority variants for contexts that need plain
 * `<button>`/`<a>` styling (e.g. Radix's AlertDialog Action/Cancel, which
 * render their own element via asChild-style composition) rather than the
 * site's Link-aware `Button` component in `Button.tsx`.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-white text-ink hover:bg-accent focus-visible:outline-white",
        outline: "border border-line text-white hover:border-accent/60 focus-visible:outline-accent",
        destructive: "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
