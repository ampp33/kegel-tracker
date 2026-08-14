import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Served from https://<user>.github.io/kegel-tracker/
export default defineConfig({
  base: process.env.VITE_BASE || '/kegel-tracker/',
  plugins: [vue()]
})
