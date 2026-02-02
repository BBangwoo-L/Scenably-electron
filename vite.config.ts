import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './electron/renderer',
  base: './',
  build: {
    outDir: '../../dist-electron',
    emptyOutDir: false,
    rollupOptions: {
      input: './electron/renderer/index.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: '../../public',
  css: {
    postcss: './postcss.config.js',
  },
});