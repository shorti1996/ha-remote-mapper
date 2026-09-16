# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""The HACS release zip must contain every runtime file and nothing else.

0.1.1 shipped without frontend/__init__.py (the zip excluded frontend/*)
and the integration failed to import on a HACS install. This pins the
packaging script to the tracked Python modules.
"""

from __future__ import annotations

import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PKG = ROOT / "custom_components" / "remote_mapper"


def _tracked(pattern: str) -> set[str]:
    out = subprocess.check_output(
        ["git", "ls-files", f"custom_components/remote_mapper/{pattern}"],
        cwd=ROOT,
        text=True,
    )
    prefix = "custom_components/remote_mapper/"
    return {line[len(prefix) :] for line in out.split() if line.startswith(prefix)}


def test_release_zip_has_every_python_module_and_no_sources(tmp_path) -> None:
    """Every tracked .py outside frontend/ is in the zip; no TS/JSON sources are."""
    out = tmp_path / "remote_mapper.zip"
    subprocess.check_call([str(ROOT / "scripts" / "package.sh"), str(out)], cwd=ROOT)
    names = set(zipfile.ZipFile(out).namelist())

    python = {p for p in _tracked("**/*.py") if not p.startswith("frontend/")}
    assert python, "git ls-files found no modules — run from the repo"
    missing = sorted(python - names)
    assert not missing, f"runtime modules missing from the zip: {missing}"

    for required in (
        "manifest.json",
        "www/remote-mapper-card.js",
        "brand/icon.png",
        "strings.json",
    ):
        assert required in names, required

    leaked = sorted(
        n
        for n in names
        if n.startswith("frontend/") or "__pycache__" in n or n.endswith(".pyc")
    )
    assert not leaked, f"non-runtime files in the zip: {leaked[:5]}"


def test_no_python_module_lives_under_frontend() -> None:
    """frontend/ is excluded wholesale, so it must never hold a Python module again."""
    assert not list((PKG / "frontend").rglob("*.py")), (
        "move Python modules out of frontend/"
    )
