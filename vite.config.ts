import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

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
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
  },
});
