import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/tokocrypto': {
        target: 'https://www.tokocrypto.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tokocrypto/, '')
      },
      '/api/indodax': {
        target: 'https://indodax.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/indodax/, '')
      }
    }
  }
})
