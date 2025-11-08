import nextPlugin from 'eslint-config-next';

const eslintConfig = [
  // Next.js recommended config (native flat config in Next.js 16)
  ...nextPlugin,
  
  // Custom rules
  {
    rules: {
      // React/Next.js specific rules
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      '@next/next/no-page-custom-font': 'off',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // General code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Import/export rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  
  // Ignores
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.mjs',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
