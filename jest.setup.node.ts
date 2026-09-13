import './test/setupEnv';

// next/headers' cookies() needs Next's per-request AsyncLocalStorage, which
// doesn't exist when a route handler is invoked directly in Jest. Registering
// the manual mock (__mocks__/next/headers.ts) here — before any test file's
// own imports run — means every node-project test gets the mock without
// repeating `jest.mock('next/headers')` itself; a literal jest.mock() call
// written inside an individual test file would work too, but only if it's
// hoisted above that file's own imports, which happens per-file, not here.
jest.mock('next/headers');
