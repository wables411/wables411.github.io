import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
    }),
  ],
  base: '/',
  server: {
    port: 3001,
    open: '/',
    historyApiFallback: true,
    fs: {
      strict: true,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        loadImages: resolve(__dirname, 'src/loadImages.js'),
        loadImages2: resolve(__dirname, 'src/loadImages2.js'),
        loadImages3: resolve(__dirname, 'src/loadImages3.js'),
        memeGenerator: resolve(__dirname, 'src/meme-generator.js'),
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wagmi',
      '@reown/appkit',
      '@reown/appkit-adapter-wagmi',
      '@tanstack/react-query',
      'react-router-dom',
    ],
  },
});