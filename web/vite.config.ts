import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El visor 3D (model-viewer + three, ~1 MB sin comprimir y 290 KB con gzip) es un archivo aparte que se baja recién
  // al abrir la remera en 3D: no frena la página. El aviso de "chunk grande" se sube para que no tape los demás
  build: { chunkSizeWarningLimit: 1100 },
})
