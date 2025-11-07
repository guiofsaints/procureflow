import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'procureflow-api',
    environment: 'node',
    include: ['apps/web/tests/**/*.test.ts'],
    globals: true,
    setupFiles: ['apps/web/tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files sequentially to avoid database conflicts
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@/server': path.resolve(__dirname, './apps/web/src/server'),
      '@/lib': path.resolve(__dirname, './apps/web/src/lib'),
      '@/domain': path.resolve(__dirname, './apps/web/src/domain'),
      '@/components': path.resolve(__dirname, './apps/web/src/components'),
    },
  },
});
