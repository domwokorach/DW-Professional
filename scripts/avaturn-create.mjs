#!/usr/bin/env node
// Creates a rigged avatar from three photos with the Avaturn API and downloads it as a GLB.
//
//   export AVATURN_TOKEN=...          # project API token from developer.avaturn.me (never written to disk)
//   node scripts/avaturn-create.mjs [male|female]
//
// Photos (JPEG/PNG), in scripts/photos/: frontal.jpg, side-1.jpg, side-2.jpg
// Output: scripts/out/avaturn.glb  (inspect it with scripts/inspect-avatar.mjs before installing)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://api.avaturn.me/api/v1';
const token = process.env.AVATURN_TOKEN;
if (!token) { console.error('Set AVATURN_TOKEN first (export AVATURN_TOKEN=...).'); process.exit(1); }
const bodyType = process.argv[2] ?? 'male';
const dir = path.join(import.meta.dirname, 'photos');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(route, init = {}) {
  const res = await fetch(`${API}${route}`, {
    ...init,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${route} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function photo(name) {
  for (const ext of ['jpg', 'jpeg', 'png']) {
    try { return { file: `${name}.${ext}`, blob: new Blob([await readFile(path.join(dir, `${name}.${ext}`))]) }; } catch {}
  }
  throw new Error(`Missing scripts/photos/${name}.jpg (or .png)`);
}

const photos = { 'image-frontal': await photo('frontal'), 'image-side-1': await photo('side-1'), 'image-side-2': await photo('side-2') };

const user = await api('/users/new', { method: 'POST' });
const userId = user.id ?? user.user_id;
console.log('user created');

const { avatar_id, upload_url } = await api('/avatars/new', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
console.log('avatar', avatar_id);

const form = new FormData();
form.set('body-type', bodyType);
form.set('telephoto', 'false');
for (const [field, { file, blob }] of Object.entries(photos)) form.set(field, blob, file);
const up = await fetch(upload_url, { method: 'POST', body: form });
if (!up.ok) throw new Error(`upload → ${up.status} ${await up.text()}`);
console.log('photos uploaded, processing…');

for (;;) {
  await sleep(5000);
  const list = await api(`/users/${userId}/avatars?include_not_ready=true`);
  const mine = (Array.isArray(list) ? list : list.avatars ?? []).find((a) => a.id === avatar_id);
  console.log('  status:', mine?.status ?? 'unknown');
  if (mine?.status === 'ready') break;
  if (mine?.status === 'failed') throw new Error('Avaturn could not process the photos (check face visibility and quality).');
}

// Avaturn: exporting a photo-only avatar is unpredictable until its customization has been set,
// so read the defaults and save them back unchanged before exporting.
try {
  const customization = await api(`/avatars/${avatar_id}/customization`);
  await api(`/avatars/${avatar_id}/customization`, { method: 'PUT', body: JSON.stringify(customization) });
  console.log('customization saved');
} catch (err) {
  console.warn('customization step skipped:', err.message);
}

for (;;) {
  const exp = await api(`/exports/new?avatar_id=${avatar_id}`, { method: 'POST' });
  console.log('  export:', exp.status);
  if (exp.status === 'failed') throw new Error('Export failed');
  if (exp.status === 'ready' && exp.url) {
    const glb = await fetch(exp.url);
    if (!glb.ok) throw new Error(`download → ${glb.status}`);
    await mkdir(path.join(import.meta.dirname, 'out'), { recursive: true });
    const out = path.join(import.meta.dirname, 'out', 'avaturn.glb');
    await writeFile(out, Buffer.from(await glb.arrayBuffer()));
    console.log('saved', out);
    break;
  }
  await sleep(5000);
}
