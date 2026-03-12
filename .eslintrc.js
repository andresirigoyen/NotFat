module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  ignorePatterns: [
    'node_modules/**',
    '.expo/**',
    'dist/**',
    'ios/**',
    'android/**',
    'supabase/**',
    '**/*.original.tsx',
    '**/*.backup.tsx',
    'Nutria_Clone_DB/**',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
  }
};
