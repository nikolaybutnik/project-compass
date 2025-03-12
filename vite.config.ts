import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    hmr: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Minify the output for production builds
    minify: 'terser',
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1600,
  },
  // More visible error reporting
  clearScreen: false,
  // Ensure .env files are properly loaded
  envPrefix: 'VITE_',
})
