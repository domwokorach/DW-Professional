'use client';

import { useState } from 'react';

/** Same sign-out as the moderation dashboard: POST with the CSRF token, then leave the admin area whatever the result. */
export default function AdminLogoutButton({ csrfToken }: { csrfToken: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'x-csrf-token': csrfToken }, credentials: 'same-origin' });
    } finally {
      window.location.assign('/admin/login');
    }
  };
  return (
    <button type="button" className="adm-btn adm-btn--ghost" onClick={logout} disabled={loggingOut}>
      {loggingOut ? 'Logging out…' : 'Log out'}
    </button>
  );
}
