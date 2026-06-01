/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { '~': resolve(__dirname, 'src') },
  },
  plugins: [preact(), crx({ manifest })],
  build: {
    target: 'es2022',
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    hmr: { port: 5176 },
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.*', 'src/**/index.ts'],
    },
  },
}));
