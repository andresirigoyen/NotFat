const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable problematic node externals
config.resolver.nodeExts = [];
config.resolver.alias = {
  'react-native': 'react-native-web',
};

module.exports = config;
