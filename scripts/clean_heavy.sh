#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WITH_EDITOR_CACHE=0

if [[ "${1:-}" == "--with-editor-cache" ]]; then
  WITH_EDITOR_CACHE=1
fi

print_size() {
  local label="$1"
  local path="$2"
  if [[ -e "$path" ]]; then
    local size
    size="$(du -sh "$path" 2>/dev/null | awk '{print $1}')"
    echo "$label: $size ($path)"
  else
    echo "$label: not found ($path)"
  fi
}

echo "[info] Starting heavy cleanup"
print_size "pnpm store (before)" "$HOME/Library/pnpm/store"
print_size "uv cache (before)" "$HOME/.cache/uv"

echo "[step] pnpm store prune"
pnpm store prune || true

if command -v uv >/dev/null 2>&1; then
  echo "[step] uv cache prune"
  uv cache prune || true
fi

echo "[step] Cleaning local project caches"
find "$ROOT_DIR" -type d \( -name ".vite" -o -name ".turbo" \) -prune -exec rm -rf {} +
find "$ROOT_DIR" -type f \( -name ".eslintcache" -o -name "*.tsbuildinfo" \) -delete

if [[ "$WITH_EDITOR_CACHE" -eq 1 ]]; then
  echo "[step] Cleaning editor caches (VS Code + Trae)"
  rm -rf "$HOME/Library/Application Support/Code/Cache" 2>/dev/null || true
  rm -rf "$HOME/Library/Application Support/Code/CachedData" 2>/dev/null || true
  rm -rf "$HOME/Library/Application Support/Code/CachedExtensionVSIXs" 2>/dev/null || true
  rm -rf "$HOME/Library/Application Support/Trae/Cache" 2>/dev/null || true
  rm -rf "$HOME/Library/Application Support/Trae/CachedData" 2>/dev/null || true
  rm -rf "$HOME/Library/Application Support/Trae/CachedExtensionVSIXs" 2>/dev/null || true
else
  echo "[info] Editor caches preserved. Use --with-editor-cache to purge them."
fi

print_size "pnpm store (after)" "$HOME/Library/pnpm/store"
print_size "uv cache (after)" "$HOME/.cache/uv"
echo "[done] Heavy cleanup finished"
