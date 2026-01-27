import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Improve long-term caching and reduce the main chunk by splitting vendors.
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            icons: ['@iconify/react'],
            motion: ['framer-motion'],
            'three-core': ['three'],
            'three-r3f': ['@react-three/fiber'],
          },
        },
      },
    },
  };
});
