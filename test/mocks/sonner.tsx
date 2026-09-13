/**
 * Global test double for `sonner`, wired in via jest.config.ts's jsdom-project
 * moduleNameMapper. Several admin components (AccountView, GeneralSettingsTab,
 * ChatSettingsTab, SecuritySettingsTab, DevicesView) call `toast.success` /
 * `toast.error` as their sole success/error UI. The real `sonner` toast store
 * only renders visibly once a `<Toaster />` is mounted somewhere in the tree
 * (which none of these unit tests do), so asserting against DOM text is not
 * possible for these flows — this mock exposes the calls directly so tests
 * can assert "an error toast was raised" the way the component actually
 * signals it. Import `toast` from this same path (or from 'sonner', which
 * resolves here) to assert on calls; call `resetSonnerMocks()` in `afterEach`
 * for clarity (also covered by Jest's global `clearMocks`).
 */
import type { ReactNode } from 'react';

export const toast = {
  success: jest.fn(),
  error: jest.fn(),
  message: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
};

export function resetSonnerMocks() {
  toast.success.mockReset();
  toast.error.mockReset();
  toast.message.mockReset();
  toast.info.mockReset();
  toast.warning.mockReset();
  toast.loading.mockReset();
  toast.dismiss.mockReset();
}

export function Toaster({ children }: { children?: ReactNode } = {}) {
  return children ?? null;
}
