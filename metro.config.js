const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .mjs files (used by zustand and other ESM libraries)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// Disable problematic node externals
config.resolver.nodeExts = [];
config.resolver.alias = {
  'react-native': 'react-native-web',
};

module.exports = config;
