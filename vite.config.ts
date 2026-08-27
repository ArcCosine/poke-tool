import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
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
