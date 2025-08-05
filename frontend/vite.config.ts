import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // This ensures that all paths are resolved relative to the root, which is
  // crucial for correct asset loading after deployment.
  base: '/',

})