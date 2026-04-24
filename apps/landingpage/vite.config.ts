import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function copyMaterializedPublicFiles() {
  const publicDir = path.resolve(__dirname, 'public')
  const outputDir = path.resolve(__dirname, 'dist')

  return {
    name: 'copy-materialized-public-files',
    closeBundle() {
      if (!fs.existsSync(publicDir)) return
      fs.mkdirSync(outputDir, { recursive: true })

      for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue

        const source = path.join(publicDir, entry.name)
        const stats = fs.statSync(source) as fs.Stats & { flags?: number }
        const flags = stats.flags ?? 0
        const isDataless = Boolean(flags & 0x40000000)
        if (isDataless) continue

        fs.copyFileSync(source, path.join(outputDir, entry.name))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyMaterializedPublicFiles()],
  build: {
    copyPublicDir: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    allowedHosts: true
  }
})
