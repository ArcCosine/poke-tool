import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'ogp.png',
        'data/*.json',
        'assets/type-icons/*.png',
        'assets/categories/*.jpg',
      ],
      manifest: {
        name: 'poke-tool - ポケモンチャンピオンズ対戦分析',
        short_name: 'poke-tool',
        description:
          'ポケモンチャンピオンズ向けの対戦データ分析・努力値計算・パーティ編成シミュレーター',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'パーティ編成',
            short_name: 'パーティ',
            description: 'パーティ編成シミュレーターを開く',
            url: '/party.html',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: '火力・耐久ランキング',
            short_name: 'ランキング',
            description: '火力・耐久ランキングを開く',
            url: '/ranking.html',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: '努力値計算',
            short_name: '努力値',
            description: '努力値・ステータス計算機を開く',
            url: '/ev-calculator.html',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json}'],
        globIgnores: ['**/assets/pokemon-sprites/**'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/pokemon-sprites\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokemon-sprites-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'master-data-cache',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ranking: resolve(__dirname, 'ranking.html'),
        evCalculator: resolve(__dirname, 'ev-calculator.html'),
        party: resolve(__dirname, 'party.html'),
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
