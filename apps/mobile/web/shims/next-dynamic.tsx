import { ComponentType, createElement, lazy, Suspense } from 'react';

type Loader<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

/** Browser replacement for next/dynamic (the ssr flag does not apply: there is no server render here). */
export default function dynamic<P extends object>(loader: Loader<P>, options: { loading?: ComponentType; ssr?: boolean } = {}) {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return 'default' in (mod as object) ? (mod as { default: ComponentType<P> }) : { default: mod as ComponentType<P> };
  });
  return function Dynamic(props: P) {
    return createElement(Suspense, { fallback: options.loading ? createElement(options.loading) : null }, createElement(Lazy as ComponentType<P>, props));
  };
}
