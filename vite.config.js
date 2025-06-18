import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  base: '/',
  publicDir: 'public',
  assetsInclude: ['**/*.gif', '**/*.png', '**/*.jpg', '**/*.ico', '**/*.mp4'],
  server: {
    port: 3001,
    open: '/',
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        lawbchess: resolve(__dirname, 'lawbchess.html'),
        chess: resolve(__dirname, 'src/chess.js'),
        leaderboard: resolve(__dirname, 'src/leaderboard.js'),
        database: resolve(__dirname, 'src/database.js'),
        multiplayer: resolve(__dirname, 'src/multiplayer.js'),
        aiWorker: resolve(__dirname, 'src/aiWorker.js'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|png|jpg|ico|mp4)$/.test(name)) {
            return 'images/[name].[ext]';
          }
          if (/\.(css)$/.test(name)) {
            return 'assets/[name].[ext]';
          }
          return '[name].[ext]';
        },
        manualChunks: {
          vendor: ['react', 'react-dom', 'wagmi'],
          wallet: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
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