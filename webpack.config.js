const webpack = require('webpack');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons', 'zustand']
    }
  }, argv);
  
  // Ensure .mjs files are treated correctly (important for zustand and other ESM libs)
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  });

  // Configure module resolution for import.meta
  config.module.rules.push({
    test: /\.(js|jsx|ts|tsx|mjs)$/,
    include: [/src/, /node_modules\/zustand/],
    use: {
      loader: 'babel-loader',
      options: {
        plugins: ['babel-plugin-transform-import-meta']
      }
    }
  });

  // Polyfill import.meta.env properties individually to ensure thorough replacement
  config.plugins.push(
    new webpack.DefinePlugin({
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'development'),
      'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production'),
      'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
      'import.meta.env': JSON.stringify({
        MODE: process.env.NODE_ENV || 'development',
        DEV: process.env.NODE_ENV !== 'production',
        PROD: process.env.NODE_ENV === 'production',
      }),
    })
  );
  
  return config;
};
