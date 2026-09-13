/**
 * Manual mock for `next/headers`, auto-applied to every test (Jest uses any
 * `<rootDir>/__mocks__/<package>` file for node_modules packages without
 * requiring an explicit jest.mock() call in each test file).
 *
 * `next/headers`'s real `cookies()` depends on Next's per-request
 * AsyncLocalStorage, which only exists inside an actual Next.js server
 * request — calling a route handler directly in Jest never sets that up.
 * src/lib/auth/guard.ts (`getAdminSession`, `requireAdminApi`) reads the
 * admin_at cookie via `cookies()` rather than `request.cookies`, so this
 * mock backs it with a plain settable store per test instead.
 */
let store = new Map<string, string>();

export function __setMockCookies(cookies: Record<string, string>) {
  store = new Map(Object.entries(cookies));
}

export function __clearMockCookies() {
  store = new Map();
}

export async function cookies() {
  return {
    get(name: string) {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      return Array.from(store.entries()).map(([name, value]) => ({ name, value }));
    },
    has(name: string) {
      return store.has(name);
    },
    set(name: string, value: string) {
      store.set(name, value);
    },
    delete(name: string) {
      store.delete(name);
    },
  };
}

export async function headers() {
  return new Headers();
}
