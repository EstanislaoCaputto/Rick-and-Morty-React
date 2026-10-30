import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.e2e.test.js'],
    testTimeout: 90000,
    hookTimeout: 240000,
    fileParallelism: false,
  },
})
