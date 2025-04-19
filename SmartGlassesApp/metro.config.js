// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix module resolution issues
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-location': require.resolve('expo-location'),
};

module.exports = config; 