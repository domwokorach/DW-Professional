// Metro config for the DW-Professional monorepo. The app imports the website's data modules, and on web its real
// section components and CSS, from ../../src, so Metro must watch the repository root's src folder.
const path = require('path');
const https = require('https');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');
const src = path.join(repoRoot, 'src');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), src];
// Resolve packages from the app first so React/React Native never come from a different copy.
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules'), path.join(repoRoot, 'node_modules')];

// Web only: the website's components are reused as they are. Next.js APIs and server-only modules are swapped
// for browser equivalents (web/shims, web/overrides); native bundles never see any of this.
const shim = (name) => path.join(projectRoot, 'web', 'shims', name);
const NEXT_SHIMS = { 'next/image': shim('next-image.tsx'), 'next/link': shim('next-link.tsx'), 'next/dynamic': shim('next-dynamic.tsx'), 'server-only': shim('empty.ts') };
// Resolved file (without extension) -> replacement. Keys are relative to src/.
const OVERRIDES = {
  'lib/avatar-store.server': 'avatar-store.ts',
  'lib/certifications.server': 'certifications.ts',
  'components/developer-id/WeatherQuickFact': 'WeatherQuickFact.tsx',
  'components/learning/CertificationsSection': 'CertificationsSection.tsx',
};
const stripExt = (p) => p.replace(/\.(web\.)?(tsx?|jsx?)$/, '');

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream ?? context.resolveRequest;
  // expo-router's route context lists app/*.web.tsx for every platform (it only filters them at runtime), so keep the
  // website components and their web-only dependencies (three/R3F etc.) out of native bundles.
  if (platform !== 'web') return moduleName.endsWith('/web/Home') ? { type: 'empty' } : resolve(context, moduleName, platform);
  if (NEXT_SHIMS[moduleName]) return { type: 'sourceFile', filePath: NEXT_SHIMS[moduleName] };
  const resolution = resolve(context, moduleName, platform);
  if (resolution.type === 'sourceFile' && resolution.filePath.startsWith(src + path.sep)) {
    const key = stripExt(path.relative(src, resolution.filePath)).split(path.sep).join('/');
    if (OVERRIDES[key]) return { type: 'sourceFile', filePath: path.join(projectRoot, 'web', 'overrides', OVERRIDES[key]) };
  }
  return resolution;
};

// Dev only: forward /api/* to the live site so the comments feed, contact form and résumé flow work without CORS.
const API_ORIGIN = new URL(process.env.EXPO_PUBLIC_API_ORIGIN || 'https://www.dominicwokorach.me');
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  if (!req.url?.startsWith('/api/')) return middleware(req, res, next);
  const headers = { ...req.headers, host: API_ORIGIN.host };
  delete headers.origin; delete headers.referer; delete headers['accept-encoding'];
  const out = https.request({ host: API_ORIGIN.hostname, path: req.url, method: req.method, headers }, (up) => { res.writeHead(up.statusCode ?? 502, up.headers); up.pipe(res); });
  out.on('error', () => { res.statusCode = 502; res.end(); });
  req.pipe(out);
};

module.exports = config;
