import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/data_privacy_dystopia/' : '/',
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'phaser': resolve(__dirname, 'node_modules/phaser/dist/phaser.esm.js'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          react: ['react', 'react-dom'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
})
