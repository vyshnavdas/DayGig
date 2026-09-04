import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["b886-2409-4073-187-1025-31cf-868f-7372-ec42.ngrok-free.app"],
  },
})