import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function copyMaterializedPublicFiles() {
  const publicDir = path.resolve(__dirname, 'public')
  const outputDir = path.resolve(__dirname, 'dist')

  function copyRecursive(srcDir: string, destDir: string) {
    if (!fs.existsSync(srcDir)) return
    fs.mkdirSync(destDir, { recursive: true })

    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const source = path.join(srcDir, entry.name)
      const target = path.join(destDir, entry.name)

      if (entry.isDirectory()) {
        copyRecursive(source, target)
        continue
      }

      if (!entry.isFile()) continue

      const stats = fs.statSync(source) as fs.Stats & { flags?: number }
      const flags = stats.flags ?? 0
      const isDataless = Boolean(flags & 0x40000000)
      if (isDataless) continue

      fs.copyFileSync(source, target)
    }
  }

  return {
    name: 'copy-materialized-public-files',
    closeBundle() {
      copyRecursive(publicDir, outputDir)
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
