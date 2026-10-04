import { closeSync, existsSync, openSync, readSync } from 'node:fs';
import path from 'node:path';
import { AVATAR_FILES, type AvatarAssets } from '@/components/hero/avatar/config';
import type { Metadata } from 'next';
import { HOME } from '@/config';
import HomeView from '@/views/HomeView';

export const metadata: Metadata = { alternates: { canonical: HOME } };

const publicFile = (url: string) => path.join(process.cwd(), 'public', url);

/** A real GLB starts with the "glTF" magic bytes; anything else (a renamed video, say) would only fail after a big download. */
function isGlb(file: string) {
  try {
    const fd = openSync(file, 'r');
    const magic = Buffer.alloc(4);
    readSync(fd, magic, 0, 4, 0);
    closeSync(fd);
    return magic.toString('latin1') === 'glTF';
  } catch {
    return false;
  }
}

export default function Page() {
  // Resolved at build time (on each request in dev). The live 3D avatar needs a valid public/avatar/dominic.glb;
  // optional files (voice, lip-sync timing, extra clips) are included only if present. Otherwise the still portrait shows.
  const heroAvatar: AvatarAssets | undefined = isGlb(publicFile(AVATAR_FILES.model))
    ? (Object.fromEntries(Object.entries(AVATAR_FILES).filter(([, url]) => existsSync(publicFile(url)))) as AvatarAssets)
    : undefined;
  return <HomeView heroAvatar={heroAvatar} />;
}
