import nextPlugin from 'eslint-config-next';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  // Next.js recommended config (native flat config in Next.js 16)
  ...nextPlugin,

  // TypeScript ESLint recommended config
  ...tseslint.configs.recommended,

  // Custom rules
  {
    rules: {
      // React/Next.js specific rules
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      '@next/next/no-page-custom-font': 'off',
      'react-hooks/set-state-in-effect': 'warn', // Allow setState in useEffect for mounted pattern

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
      // Build outputs
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      '.turbo/**',

      // Dependencies
      'node_modules/**',

      // Generated/copied files
      'public/docs/**',
      'build-info.json',
      '.env.buildinfo',

      // Config files
      'scripts/**/*.js',
      '*.config.js',
      '*.config.mjs',
      'next-env.d.ts',

      // Test files
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'coverage/**',

      // TypeScript cache
      '*.tsbuildinfo',
    ],
  },
];

export default eslintConfig;
