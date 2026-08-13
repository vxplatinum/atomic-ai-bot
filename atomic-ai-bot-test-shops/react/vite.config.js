import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Dashboard SPA is :5173. This shop stays on :5174 so both can run.
  server: {
    port: 5174,
  },
})
