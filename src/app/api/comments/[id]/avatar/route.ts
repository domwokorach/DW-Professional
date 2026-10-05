import { getAdminSession } from '@/lib/admin/session.server';
import { readAvatar } from '@/lib/avatar-store.server';
import { adminAvatarKey, approvedAvatarKey } from '@/lib/comment-store.server';

export const dynamic = 'force-dynamic';

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

/**
 * A comment's avatar. Public only once the comment is approved; before that (or after rejection) only a
 * signed-in admin gets it, uncached. The bucket itself is private, so this is the only way to the image.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return notFound();

  let key = await approvedAvatarKey(id).catch(() => null);
  let cache = 'public, max-age=300, s-maxage=300';
  if (!key) {
    const session = await getAdminSession();
    if (!session.ok) return notFound();
    key = await adminAvatarKey(id).catch(() => null);
    cache = 'private, no-store';
  }
  if (!key) return notFound();

  const avatar = await readAvatar(key);
  if (!avatar) return notFound();
  return new Response(avatar.body, {
    headers: {
      'Content-Type': avatar.contentType,
      ...(avatar.size ? { 'Content-Length': String(avatar.size) } : {}),
      'Cache-Control': cache,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
