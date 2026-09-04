import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 15000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
