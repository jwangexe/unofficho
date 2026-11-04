/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { reviewPlugin } from './scripts/review.ts';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    // Book pages: YAML frontmatter is exported as `frontmatter`; tables via GFM; $…$ and $$…$$ become KaTeX at build time.
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }], remarkGfm, remarkMath],
        rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
      }),
    },
    react({ include: /\.(mdx|[jt]sx?)$/ }),
    // Dev only: lets the /review page mark content reviewed in its source file.
    reviewPlugin(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'UnoffIChO',
        short_name: 'UnoffIChO',
        description:
          'An unofficial, independent study resource for chemistry olympiad preparation.',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // All content is bundled, so precaching the build output gives full offline support.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // The link-preview image is only for crawlers and chat apps.
        globIgnores: ['og.png'],
        navigateFallback: '/index.html',
        // The suggestions API must always reach the network.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  // `npm run dev` has no API; run `npx wrangler dev` alongside it to try suggestions locally.
  server: { proxy: { '/api': 'http://localhost:8787' } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['fake-indexeddb/auto'],
    // The cache keys on a file's own source, so an import.meta.glob would not see newly
    // added content files (book pages, reagent JSON) until the cache was cleared.
    fsModuleCache: false,
  },
});
