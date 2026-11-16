// Metro config for the DW-Professional monorepo. The mobile app imports the website's data modules
// (../../src/data) directly instead of keeping copies, so Metro must watch the repository root.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), path.join(repoRoot, 'src', 'data'), path.join(repoRoot, 'src', 'types'), path.join(repoRoot, 'src', 'config')];
// Resolve packages from the app first so React/React Native never come from a different copy.
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules'), path.join(repoRoot, 'node_modules')];

module.exports = config;
