import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },

  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for production
    sourcemap: true,

    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],

          // UI libraries chunk (if used)
          // ui: ['@headlessui/react', '@heroicons/react'],

          // Data fetching chunk
          data: [
            '@tanstack/react-query',
            'axios',
          ],
        },

        // Asset file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]'
          }

          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]'
          }

          return 'assets/[name]-[hash][extname]'
        },
      },
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Asset inline limit (base64)
    assetsInlineLimit: 4096,
  },

  // Server configuration for development
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Preview server configuration
  preview: {
    port: 3000,
  },

  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
})
