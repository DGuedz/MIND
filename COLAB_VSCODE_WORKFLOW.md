# Colab in VS Code/Trae Workflow

Objective: keep local coding in the editor while executing notebooks on Google Colab runtimes.

## 1) Bootstrap in this repository

```bash
pnpm setup:colab
```

This installs (or validates):
- `google.colab`
- `ms-toolsai.jupyter`
- `ms-python.python`

It works with editor CLIs in this order: `EDITOR_CLI`, `code`, `code-insiders`, `trae`, `cursor`, `codium`.

## 2) Connect notebook to Colab runtime

1. Open/create any `.ipynb` in this workspace.
2. Click `Select Kernel` in notebook toolbar.
3. Choose `Colab`.
4. Choose `Auto Connect` or `New Colab Server`.
5. Authenticate with Google account.

## 3) Keep local + remote in one flow

- For quick sync: right click local files/folders -> `Upload to Colab`.
- For integrated editing in one workspace:
  - `Colab: Mount Server to Workspace...` (experimental, enabled in workspace settings).
  - Edit files directly on runtime filesystem from the editor.
  - Use refresh in the Colab view if external changes are not auto-detected.

## 4) Validate runtime and GPU

In a notebook cell or terminal connected to Colab:

```bash
python3 scripts/colab_runtime_probe.py
```

Expected: JSON report with `gpu_available` and `gpu_name`.

## 5) Important constraint (official Colab policy)

- Free Colab compute is dynamic and not guaranteed.
- GPU type (including T4) can vary over time based on availability.
- Treat `T4` as "preferred when available", not as a guaranteed resource.

## 6) Troubleshooting (Tailwind in monorepo)

Symptom: VS Code/Trae shows missing `tailwindcss-animate`, even when installed.

1. Validate plugin installation:

```bash
pnpm check:tailwind
```

2. If check passes but IDE still warns:
- `Cmd + Shift + P` -> `Tailwind CSS: Restart Language Server`
- `Cmd + Shift + P` -> `Developer: Reload Window`

3. If machine is slow or caches are stale:

```bash
pnpm clean:heavy
```

4. Deep clean (also editor caches):

```bash
pnpm clean:heavy -- --with-editor-cache
```

References:
- https://developers.googleblog.com/en/google-colab-is-coming-to-vs-code/
- https://marketplace.visualstudio.com/items?itemName=Google.colab
- https://github.com/googlecolab/colab-vscode/wiki/User-Guide
- https://research.google.com/colaboratory/faq.html
