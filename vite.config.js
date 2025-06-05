import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      './App.jsx': path.resolve(__dirname, './src/src/src/App.jsx'),
      './index.css': path.resolve(__dirname, './src/src/src/index.css')
    }
  }
})
