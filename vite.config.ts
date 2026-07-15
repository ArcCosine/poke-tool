import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { resolve } from 'path';

// Resolve Interoperability for ES modules
// biome-ignore lint/suspicious/noExplicitAny: compiler compatibility fallback
const wasmPlugin = (wasm as any).default || wasm;
// biome-ignore lint/suspicious/noExplicitAny: compiler compatibility fallback
const topLevelAwaitPlugin = (topLevelAwait as any).default || topLevelAwait;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    wasmPlugin(),
    topLevelAwaitPlugin(),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        disclaimer: resolve(__dirname, 'disclaimer.html'),
        terms: resolve(__dirname, 'terms.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
  },
});
