// The QuarterRing loading spinner supplied for this project, unchanged in look and motion: a ring whose
// top and right edges are drawn in the current colour and rotated once per --duration (default 1s).
// Only the styling layer differs: this project uses plain CSS rather than Tailwind and has no `cn()`,
// so the utility classes become `.quarter-ring` in src/styles/portfolio-access.css and `className`
// is joined by hand.
import type { ComponentProps } from 'react';

function QuarterRing({ className, ...props }: ComponentProps<'span'>) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-quarter-ring-rotation {
          0% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <span
        role="status"
        className={['quarter-ring', className].filter(Boolean).join(' ')}
        style={{
          animation: 'loading-ui-quarter-ring-rotation var(--duration, 1s) linear infinite',
        }}
        {...props}
      >
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

export { QuarterRing };
