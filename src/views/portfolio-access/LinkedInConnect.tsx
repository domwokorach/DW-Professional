'use client';

import { CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TechIcon } from '@/components/ui';

export type LinkedInStatus = 'connected' | 'cancelled' | 'error' | 'expired' | 'unavailable';
type Connection = { name: string | null; picture: string | null; email: string | null; connectedAt: string };

const MESSAGES: Record<LinkedInStatus, { text: string; ok: boolean }> = {
  connected: { text: 'LinkedIn connected. Review your details, then press Submit.', ok: true },
  cancelled: { text: 'LinkedIn sign-in was cancelled. You can try again or continue without it.', ok: false },
  error: { text: 'We couldn’t connect your LinkedIn account. You can try again or continue without it.', ok: false },
  expired: { text: 'That LinkedIn sign-in took too long or was already used. You can try again or continue without it.', ok: false },
  unavailable: { text: 'LinkedIn sign-in isn’t available right now. You can continue without it.', ok: false },
};

const initials = (name: string | null) =>
  (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => Array.from(w)[0]?.toUpperCase()).join('') || 'in';

/**
 * "Continue with LinkedIn" (Sign In with LinkedIn using OpenID Connect). Shown only when the server has LinkedIn
 * configured. `onConnect` keeps the form draft (sessionStorage, never the URL) before the page goes to LinkedIn;
 * `status` is what the callback reported when the candidate came back. Optional: nothing here blocks Submit.
 */
export default function LinkedInConnect({
  status,
  onConnect,
  attachmentPending,
  disabled,
}: {
  status: LinkedInStatus | null;
  onConnect: () => void;
  attachmentPending: boolean;
  disabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [busy, setBusy] = useState<'redirecting' | 'disconnecting' | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(status ? MESSAGES[status] : null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (status) setMessage(MESSAGES[status]);
  }, [status]);

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/linkedin/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { enabled?: boolean; connection?: Connection | null } | null) => {
        if (!alive || !body) return;
        setEnabled(Boolean(body.enabled));
        setConnection(body.connection ?? null);
      })
      .catch(() => undefined); // LinkedIn is optional: on failure the control simply isn't shown
    return () => {
      alive = false;
    };
  }, [status]);

  // Not configured (or not yet known): no LinkedIn button, but keep any message from a return trip.
  if (!enabled && !message) return null;

  const connect = () => {
    if (busy || disabled) return;
    setBusy('redirecting');
    onConnect();
  };

  const disconnect = async () => {
    if (busy) return;
    setBusy('disconnecting');
    try {
      const res = await fetch('/api/auth/linkedin/disconnect', { method: 'POST', credentials: 'same-origin' });
      if (res.ok) {
        setConnection(null);
        setAvatarFailed(false);
        setMessage({ text: 'LinkedIn disconnected. Nothing from it will be sent.', ok: true });
      } else {
        setMessage({ text: 'LinkedIn couldn’t be disconnected. Please try again.', ok: false });
      }
    } catch {
      setMessage({ text: 'LinkedIn couldn’t be disconnected. Please try again.', ok: false });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="pa-li">
      {enabled && (connection ? (
        <div className="pa-li__connected">
          {connection.picture && !avatarFailed ? (
            // LinkedIn's own image host; no referrer is sent with the request.
            <img className="pa-li__avatar" src={connection.picture} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />
          ) : (
            <span className="pa-li__avatar pa-li__avatar--initials" aria-hidden="true">{initials(connection.name)}</span>
          )}
          <span className="pa-li__who">
            <span className="pa-li__status"><CheckIcon aria-hidden="true" />LinkedIn connected</span>
            {connection.name && <span className="pa-li__name">{connection.name}</span>}
            {connection.email && <span className="pa-li__email">{connection.email}</span>}
          </span>
          <button type="button" className="pa-attach__remove pa-li__disconnect" onClick={() => void disconnect()} disabled={disabled || busy !== null}>
            {busy === 'disconnecting' ? 'Disconnecting…' : 'Disconnect LinkedIn'}
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="pa-import__btn pa-li__btn"
            onClick={connect}
            aria-disabled={busy !== null || disabled || undefined}
            aria-describedby="pa-li-hint"
          >
            <TechIcon icon="simple-icons:linkedin" fallback="in" className="pa-li__logo" />
            {busy === 'redirecting' ? 'Opening LinkedIn…' : 'Continue with LinkedIn'}
          </button>
          <p className="pa-note pa-li__hint" id="pa-li-hint">
            Optional. Shares your LinkedIn name and email; what you've typed here is kept while you sign in.
            {attachmentPending && <> Your attachment will need adding again afterwards.</>}
          </p>
        </>
      ))}
      <p className={`pa-li__msg${message && !message.ok ? ' pa-li__msg--warn' : ''}`} role="status" aria-live="polite">
        {message?.text}
      </p>
    </div>
  );
}
