import { linkedInEnabled, readIdentity } from '@/lib/linkedin.server';

export const dynamic = 'force-dynamic';

/**
 * GET → whether "Continue with LinkedIn" is available, and the candidate's own connection (from their HttpOnly cookie)
 * for the connected state. Only display fields; never tokens or configuration.
 */
export function GET(request: Request) {
  const enabled = linkedInEnabled();
  const id = enabled ? readIdentity(request) : null;
  return Response.json(
    { enabled, connection: id ? { name: id.name, picture: id.picture, email: id.email, connectedAt: id.connectedAt } : null },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
