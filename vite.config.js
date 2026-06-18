import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // accesible desde otras PC de la red local en desarrollo
    proxy: {
      // En desarrollo, redirige las llamadas /api al servidor backend.
      '/api': 'http://localhost:3001',
    },
  },
})
