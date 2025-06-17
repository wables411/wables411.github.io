import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic', fastRefresh: true })],
  base: '/',
  publicDir: 'public', // Copies /public/ to /dist/
  assetsInclude: ['**/*.gif', '**/*.png', '**/*.jpg', '**/*.ico'], // Include images
  server: {
    port: 3001,
    open: '/',
    historyApiFallback: true,
    fs: { strict: true },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lawbchess: resolve(__dirname, 'lawbchess.html'),
        loadImages: resolve(__dirname, 'src/loadImages.js'),
        loadImages2: resolve(__dirname, 'src/loadImages2.js'),
        loadImages3: resolve(__dirname, 'src/loadImages3.js'),
        memeGenerator: resolve(__dirname, 'src/meme-generator.js'),
        chess: resolve(__dirname, 'src/chess.js'),
        leaderboard: resolve(__dirname, 'src/leaderboard.js'),
        database: resolve(__dirname, 'src/database.js'),
        multiplayer: resolve(__dirname, 'src/multiplayer.js'),
        aiWorker: resolve(__dirname, 'src/aiWorker.js'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|png|jpg|ico)$/.test(name)) {
            return 'images/[name].[ext]'; // Images to /dist/images/
          }
          if (/\.(css)$/.test(name)) {
            return 'assets/[name].[ext]'; // CSS to /dist/assets/
          }
          if (/\.(html)$/.test(name)) {
            return '[name].[ext]'; // HTML to /dist/
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '/assets/leaderboard.js': resolve(__dirname, 'src/leaderboard.js'),
      '/assets/multiplayer.js': resolve(__dirname, 'src/multiplayer.js'),
      '/assets/chess.js': resolve(__dirname, 'src/chess.js'),
      '/assets/aiWorker.js': resolve(__dirname, 'src/aiWorker.js'),
      '/assets/style.css': resolve(__dirname, 'src/style.css'),
      '/assets/chess.css': resolve(__dirname, 'src/chess.css'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'wagmi', '@reown/appkit', '@reown/appkit-adapter-wagmi', '@tanstack/react-query', 'react-router-dom'],
  },
});