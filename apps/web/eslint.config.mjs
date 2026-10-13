import nextConfig from 'eslint-config-next/core-web-vitals';

const tsPlugin = nextConfig.find((c) => c?.plugins?.['@typescript-eslint'])?.plugins?.['@typescript-eslint'];

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'out/**', '**/.next/**'],
  },
  ...nextConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      ...(tsPlugin ? { '@typescript-eslint': tsPlugin } : {}),
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
