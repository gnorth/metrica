import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  root: path.resolve(projectRoot, 'android-web'),
  publicDir: path.resolve(projectRoot, 'public'),
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: {
    outDir: path.resolve(projectRoot, 'android/app/src/main/assets/www'),
    emptyOutDir: true,
  },
});
