#!/usr/bin/env python3
"""Package release assets: the installable bundle and the skill fallback.

Run `python scripts/build.py` first so `bundle/skill/` exists. Output goes to
`dist/` and is reproducible: entries are sorted and timestamps are fixed.
"""

from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
BUNDLE = ROOT / "bundle"
SKILL = ROOT / "skill"
FIXED_TIME = (1980, 1, 1, 0, 0, 0)
SKIP_DIRS = {"__pycache__", ".sot-tmp", "node_modules", ".git"}


def fail(message: str) -> None:
    raise SystemExit(f"package: error: {message}")


def add_tree(archive: zipfile.ZipFile, base: Path, prefix: str) -> int:
    count = 0
    # Sort by the POSIX relative path: Path ordering is case-insensitive on
    # Windows and case-sensitive on Linux, which would change the entry order
    # and therefore the archive bytes.
    paths = sorted(base.rglob("*"), key=lambda item: item.relative_to(base).as_posix())
    for path in paths:
        rel = path.relative_to(base).as_posix()
        if any(part in SKIP_DIRS for part in Path(rel).parts):
            continue
        if path.is_symlink() or not path.is_file():
            continue
        info = zipfile.ZipInfo(f"{prefix}/{rel}", date_time=FIXED_TIME)
        # Stored (not deflated): zlib output differs across Python builds, which
        # would make the release assets and SHA256SUMS non-reproducible.
        info.compress_type = zipfile.ZIP_STORED
        # Pin the platform field too; Windows and Linux would otherwise write
        # different create_system values into the local file header.
        info.create_system = 3
        info.external_attr = 0o644 << 16
        archive.writestr(info, path.read_bytes())
        count += 1
    return count


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    if not (BUNDLE / "skill" / "SKILL.md").is_file():
        fail("bundle/skill is missing; run `python scripts/build.py` first")
    compat = json.loads((ROOT / "compat.json").read_text(encoding="utf-8"))
    version = compat["bundle_version"]

    DIST.mkdir(exist_ok=True)
    for stale in DIST.glob("*"):
        if stale.is_file():
            stale.unlink()

    bundle_zip = DIST / f"dsh-self-organizing-agent-team-bundle-{version}.zip"
    with zipfile.ZipFile(bundle_zip, "w") as archive:
        bundle_files = add_tree(archive, BUNDLE, "dsh-self-organizing-agent-team")

    skill_zip = DIST / f"self-organizing-agent-team-skill-{version}.zip"
    with zipfile.ZipFile(skill_zip, "w") as archive:
        skill_files = add_tree(archive, SKILL, "self-organizing-agent-team")

    sums = DIST / "SHA256SUMS"
    lines = [f"{sha256(path)}  {path.name}" for path in sorted(DIST.glob("*.zip"))]
    sums.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")

    print(f"bundle asset: {bundle_zip.name} ({bundle_files} files, {bundle_zip.stat().st_size} bytes)")
    print(f"skill asset:  {skill_zip.name} ({skill_files} files, {skill_zip.stat().st_size} bytes)")
    print(f"checksums:    {sums.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
