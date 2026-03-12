module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/hooks': './src/hooks',
            '@/services': './src/services',
            '@/constants': './src/constants',
            '@/utils': './src/utils',
            '@/types': './src/types',
            '@/store': './src/store',
            '@/navigation': './src/navigation'
          }
        }
      ],
      'babel-plugin-transform-import-meta'
    ]
  };
};
