import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin API calls during development, so the auth cookie just works.
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: { environment: 'node' },
})
