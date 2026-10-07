import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SpinnerButton3Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

/** Local adaptation of Shadcn Blocks Spinner Button 3. Both labels stay in the grid to prevent layout shift. */
export default function SpinnerButton3({ loading, loadingLabel = 'Sending...', children, ...props }: SpinnerButton3Props) {
  return (
    <button {...props} aria-busy={loading}>
      <span className="spinner-button-3__content" data-visible={!loading || undefined} aria-hidden={loading}>
        {children}
      </span>
      <span className="spinner-button-3__content" data-visible={loading || undefined} aria-hidden={!loading}>
        <span className="spinner-button-3__spinner" aria-hidden="true" />
        {loadingLabel}
      </span>
    </button>
  );
}
