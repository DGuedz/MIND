#!/usr/bin/env python3
"""Runtime probe for Colab kernels connected from VS Code/Trae."""

from __future__ import annotations

import json
import os
import platform
import subprocess
from datetime import datetime, timezone


def _run(cmd: list[str]) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True)
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except OSError as exc:
        return 127, "", str(exc)


def detect_gpu() -> dict[str, object]:
    code, out, err = _run(
        ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"]
    )
    if code != 0 or not out:
        return {
            "gpu_available": False,
            "gpu_name": None,
            "gpu_memory_total": None,
            "driver_version": None,
            "gpu_is_t4": False,
            "probe_error": err or "nvidia-smi not available",
        }

    first = out.splitlines()[0]
    parts = [p.strip() for p in first.split(",")]
    gpu_name = parts[0] if len(parts) > 0 else None
    gpu_memory_total = parts[1] if len(parts) > 1 else None
    driver_version = parts[2] if len(parts) > 2 else None

    return {
        "gpu_available": True,
        "gpu_name": gpu_name,
        "gpu_memory_total": gpu_memory_total,
        "driver_version": driver_version,
        "gpu_is_t4": bool(gpu_name and "T4" in gpu_name.upper()),
        "probe_error": None,
    }


def main() -> None:
    report = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "cwd": os.getcwd(),
        "is_colab_env": bool(
            os.environ.get("COLAB_RELEASE_TAG")
            or os.environ.get("COLAB_BACKEND_VERSION")
            or "google.colab" in str(os.environ.get("JPY_PARENT_PID", ""))
        ),
    }
    report.update(detect_gpu())
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
