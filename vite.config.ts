import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Voting service proxy
      '/api/voting': {
        target: 'https://ems-voting-service.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/voting/, ''),
      },
      // Notifications service proxy
      '/api/notifications': {
        target: 'https://ems-notification-service.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      // HR service proxy
      '/api/hr': {
        target: 'https://ems-human-resources-management-service.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/hr/, '/api/hr'),
      },
      // General API proxy (MUST be last)
      '/api': {
        target: 'http://iamauth.runasp.net',
        changeOrigin: true,
      },
    },
  },
})
