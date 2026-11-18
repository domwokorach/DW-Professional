// Copies the website's public/ files (hero images, project images, certificates, Rolex assets) into apps/mobile/public,
// which Expo serves at the web root. The 12 MB 3D avatar model is skipped (the hero uses the layered 2D character).
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, '../../public');
const to = path.join(root, 'public');
const skip = new Set(['avatar', 'draco']);

if (existsSync(to)) rmSync(to, { recursive: true });
mkdirSync(to, { recursive: true });
for (const name of readdirSync(from)) if (!skip.has(name)) cpSync(path.join(from, name), path.join(to, name), { recursive: true });
// Expo uses public/index.html as the page template.
copyFileSync(path.join(root, 'web/index.html'), path.join(to, 'index.html'));
console.log(`Synced public/ -> apps/mobile/public (skipped: ${[...skip].join(', ')})`);
