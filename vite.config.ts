import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SHARE=1 builds one self-contained HTML file (no server, works from disk, email or any static host).
const share = process.env.SHARE === '1';

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(share ? [viteSingleFile()] : [])],
  base: './',
  build: share ? { outDir: 'dist-share', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 6000 } : undefined,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
