const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

config.watchFolders = [...(config.watchFolders || []), workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// react / react-native: redirect every import to app-local copy via extraNodeModules
// (works for transitive deps in root node_modules too)
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules', 'react'),
  'react-native': path.resolve(projectRoot, 'node_modules', 'react-native'),
};

// Native view packages: block root copies entirely so they can't register twice.
// Do NOT include react/react-native here — blockList breaks transitive resolution.
const nativeSingletons = [
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-reanimated',
  'react-native-gesture-handler',
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

config.resolver.blockList = nativeSingletons.map(
  (pkg) =>
    new RegExp(
      `^${escapeRegex(path.resolve(workspaceRoot, 'node_modules', pkg))}\\/.*$`
    )
);

module.exports = config;
