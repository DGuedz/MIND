import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

function copyPublicAllowlist() {
  const publicDir = path.resolve(__dirname, 'public')
  const outputDir = path.resolve(__dirname, 'dist')

  const allowlist = [
    'favicon.svg',
    'icons.svg',
    'logo_hero.svg',
    'mind_fingerprint_head.svg',
    'mind_logo.png',
    'sanduiche_rev_mind_solana_core.mp4',
    'catalog/skills.json',
    'catalog/products.json'
  ]

  const copyFile = (relativePath: string) => {
    const source = path.join(publicDir, relativePath)
    const target = path.join(outputDir, relativePath)
    if (!fs.existsSync(source)) {
      throw new Error(`[public-copy] missing required public asset: ${relativePath}`)
    }
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
  }

  return {
    name: 'copy-public-allowlist',
    closeBundle() {
      for (const relPath of allowlist) copyFile(relPath)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicAllowlist()],
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
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
})
