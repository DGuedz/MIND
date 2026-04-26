#!/usr/bin/env bash
set -euo pipefail

declare -a editor_candidates=("code" "code-insiders" "trae" "cursor" "codium")

pick_editor_cli() {
  if [[ -n "${EDITOR_CLI:-}" ]] && command -v "${EDITOR_CLI}" >/dev/null 2>&1; then
    printf '%s' "${EDITOR_CLI}"
    return
  fi

  for cli in "${editor_candidates[@]}"; do
    if command -v "${cli}" >/dev/null 2>&1; then
      printf '%s' "${cli}"
      return
    fi
  done

  printf ''
}

install_if_missing() {
  local editor_cli="$1"
  local extension="$2"

  if "${editor_cli}" --list-extensions | grep -iqFx "${extension}"; then
    echo "[ok] ${extension} already installed"
    return
  fi

  echo "[install] ${extension}"
  "${editor_cli}" --install-extension "${extension}" --force >/dev/null
}

main() {
  local editor_cli
  editor_cli="$(pick_editor_cli)"

  if [[ -z "${editor_cli}" ]]; then
    echo "[error] No compatible editor CLI found."
    echo "Set EDITOR_CLI to one of: ${editor_candidates[*]}"
    exit 1
  fi

  echo "[info] Using editor CLI: ${editor_cli}"
  install_if_missing "${editor_cli}" "ms-toolsai.jupyter"
  install_if_missing "${editor_cli}" "google.colab"
  install_if_missing "${editor_cli}" "ms-python.python"

  cat <<'EOF'
[done] Colab workflow bootstrap completed.

Next steps in VS Code/Trae:
1) Open/create a .ipynb notebook in this repo.
2) Select Kernel -> Colab -> Auto Connect (or New Colab Server).
3) Runtime hardware:
   - Free tier hardware is dynamic and not guaranteed.
   - If T4 appears, select it. If not, use available GPU and continue.
4) Run: python3 scripts/colab_runtime_probe.py
EOF
}

main "$@"
