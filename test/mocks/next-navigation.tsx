/**
 * Global test double for `next/navigation`, wired in via jest.config.ts's
 * jsdom-project moduleNameMapper (not the `__mocks__` node_modules
 * convention, since this needs to apply unconditionally without every
 * component test calling jest.mock() itself). The real hooks throw outside
 * an actual App Router request ("invariant expected app router to be
 * mounted"), which every rendered client component here would otherwise hit.
 *
 * Import `__mockRouter` / `__setMockPathname` / `__setMockSearchParams` from
 * this same path in a test to assert on navigation calls or change what the
 * hooks return; `resetNextNavigationMocks()` (call in `afterEach`) clears
 * spies and resets pathname/search params to their defaults.
 */
export const __mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

let mockPathname = '/';
let mockSearchParams = new URLSearchParams();
let mockParams: Record<string, string> = {};

export function __setMockPathname(pathname: string) {
  mockPathname = pathname;
}

export function __setMockSearchParams(params: URLSearchParams | Record<string, string>) {
  mockSearchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params);
}

export function __setMockParams(params: Record<string, string>) {
  mockParams = params;
}

export function resetNextNavigationMocks() {
  __mockRouter.push.mockReset();
  __mockRouter.replace.mockReset();
  __mockRouter.refresh.mockReset();
  __mockRouter.back.mockReset();
  __mockRouter.forward.mockReset();
  __mockRouter.prefetch.mockReset();
  mockPathname = '/';
  mockSearchParams = new URLSearchParams();
  mockParams = {};
}

export function useRouter() {
  return __mockRouter;
}

export function usePathname() {
  return mockPathname;
}

export function useSearchParams() {
  return mockSearchParams;
}

export function useParams() {
  return mockParams;
}

export function redirect(url: string): never {
  throw new Error(`NEXT_REDIRECT:${url}`);
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
