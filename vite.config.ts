import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/notifications': {
        target: 'https://ems-notification-service.onrender.com',
        changeOrigin: true,
      },
      '/api/hr': {
        target: 'https://ems-human-resources-management-service.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hr/, '/api/hr'),
      },
      '/api/project-management': {
        target: 'http://projectmanagmentservices.runasp.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/project-management/, '/api'),
      },
      '/api': {
        target: 'http://iamauth.runasp.net',
        changeOrigin: true,
      },
    },
  },
})
