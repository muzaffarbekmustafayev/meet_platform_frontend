import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'util', 'stream', 'buffer'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  // Buni qo'shing:
  base: '/', 
  build: {
    outDir: 'dist', // Build natijasi aynan dist papkasiga tushishini kafolatlaydi
  }
})