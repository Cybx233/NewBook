import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist/manifest.json'))
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), copyManifest()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
})
