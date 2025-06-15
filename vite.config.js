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
  publicDir: 'images',
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
        chess: resolve(__dirname, 'src/chess.js'),
        leaderboard: resolve(__dirname, 'src/leaderboard.js'),
        database: resolve(__dirname, 'src/database.js'),
        multiplayer: resolve(__dirname, 'src/multiplayer.js'),
        aiWorker: resolve(__dirname, 'src/AiWorker.js'),
      },
      output: {
        // Disable hashing for predictable filenames
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
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