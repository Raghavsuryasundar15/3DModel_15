import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Allow .glb and .hdr files to be served as static assets
  assetsInclude: ['**/*.glb', '**/*.hdr'],
  server: { port: 5173 }
})
