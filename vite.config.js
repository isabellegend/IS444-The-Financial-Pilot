import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  },
  server: {
    port: 3000,
    // Dev proxy — forwards /api calls to OutSystems so you avoid CORS issues
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      '/chatbot-proxy': {
        target: 'https://personal-ne1thpev.outsystemscloud.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/chatbot-proxy/, '')
      }
    }
  }
})
