import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tooling/vitest-server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
      'lib/**/*.test.ts',
      'app/api/**/*.test.ts',
      'tooling/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'packages/domain/src/schemas.ts',
        'packages/domain/src/search.ts',
        'packages/domain/src/sync.ts',
        'packages/domain/src/urls.ts',
        'packages/content/src/index.ts',
      ],
      exclude: ['**/*.d.ts', '**/*.test.*'],
      thresholds: {
        statements: 80,
        branches: 65,
        functions: 80,
        lines: 80
      }
    }
  }
});
