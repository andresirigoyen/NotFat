const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .mjs files (used by zustand and other ESM libraries)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
