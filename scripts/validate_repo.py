#!/usr/bin/env python3
"""Validate the repository: manifest, compat pins, snapshots, and skill files.

`core_snapshot` covers only the files inherited unchanged from the core skill
repository (`core_scope`); DSH-owned files (SKILL.md, test scripts, adapters,
snapshot tool) are pinned by `dsh_skill_snapshot` instead.

Use `--print` to emit the computed snapshot values before updating compat.json.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skill"
BUNDLE = ROOT / "bundle"
COMPAT = ROOT / "compat.json"

EXCLUDED_DIRS = {
    ".git", ".dsh", ".venv", "venv", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", "node_modules", ".sot-tmp", "dist", "build",
}
FRONTMATTER = re.compile(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?")
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
REVISION_RE = re.compile(r"^worktree-snapshot:[0-9a-f]{64}$")

REQUIRED_REPO = (
    "README.md",
    "README.zh-CN.md",
    "LICENSE",
    "compat.json",
    ".github/workflows/release.yml",
    "bundle/package.json",
    "bundle/cordis.patch.yml",
    "bundle/index.js",
    "bundle/client.js",
    "bundle/icon.svg",
    "bundle/locale/en.json",
    "bundle/locale/zh.json",
)

REQUIRED_SKILL = (
    "SKILL.md",
    "README.md",
    "LICENSE",
    "references/role-catalog.md",
    "references/scheduling-policy.md",
    "references/evidence-and-gates.md",
    "references/risk-and-authorization.md",
    "templates/task-contract.md",
    "templates/evidence-manifest.md",
    "templates/handoff.md",
    "templates/plan-review.md",
    "templates/code-review.md",
    "templates/acceptance.md",
    "scripts/validate_task_contract.py",
    "scripts/test_validate_task_contract.py",
    "scripts/test_forward_scenarios.py",
    "scripts/snapshot_worktree.py",
    "adapters/deepseek-harness/README.md",
    "adapters/deepseek-harness/TEAM-PROTOCOL.md",
)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def _payload(path: Path) -> bytes:
    if path.is_symlink():
        return b"link:" + os.readlink(path).encode("utf-8", "surrogateescape")
    return b"file:" + path.read_bytes()


def snapshot_tree(root: Path, accept=None) -> tuple[str, int]:
    """Canonical walk order from scripts/snapshot_worktree.py, optionally filtered."""
    digest = hashlib.sha256()
    count = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(name for name in dirnames if name not in EXCLUDED_DIRS)
        current = Path(dirpath)
        for name in sorted(filenames):
            path = current / name
            rel = path.relative_to(root).as_posix()
            if accept is not None and not accept(rel):
                continue
            digest.update(rel.encode("utf-8"))
            digest.update(b"\0")
            digest.update(_payload(path))
            digest.update(b"\0")
            count += 1
    return digest.hexdigest(), count


def load_snapshot_tool():
    path = SKILL / "scripts" / "snapshot_worktree.py"
    spec = importlib.util.spec_from_file_location("snapshot_worktree", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"validate: cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def in_scope(rel: str, scope: list[str]) -> bool:
    for entry in scope:
        if entry.endswith("/"):
            if rel.startswith(entry):
                return True
        elif rel == entry:
            return True
    return False


def parse_frontmatter(text: str) -> dict[str, str]:
    match = FRONTMATTER.match(text)
    if not match:
        return {}
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        field = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)
        if field:
            fields[field.group(1)] = field.group(2).strip().strip("'\"")
    return fields


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate the DSH bundle repository.")
    parser.add_argument("--core-ref", help="Require compat.json core_ref to equal this value.")
    parser.add_argument("--print", action="store_true", dest="print_only", help="Print computed values only.")
    args = parser.parse_args(argv)

    errors: list[str] = []
    if not COMPAT.is_file():
        raise SystemExit("validate: compat.json is missing")
    compat = json.loads(COMPAT.read_text(encoding="utf-8"))

    for key in ("schema_version", "adapter", "core_repo", "core_ref", "core_scope",
                "core_snapshot", "dsh_skill_snapshot", "dsh_version_checked",
                "dsh_profile", "bundle", "bundle_version", "skill"):
        if key not in compat:
            fail(errors, f"compat.json missing key: {key}")
    if compat.get("schema_version") != 1:
        fail(errors, "compat.json schema_version must be 1")
    if compat.get("adapter") != "dsh-agent-team-v1":
        fail(errors, "compat.json adapter must be dsh-agent-team-v1")
    if not isinstance(compat.get("core_scope"), list) or not compat.get("core_scope"):
        fail(errors, "compat.json core_scope must be a non-empty list")
    if args.core_ref and compat.get("core_ref") != args.core_ref:
        fail(errors, f"compat.json core_ref {compat.get('core_ref')!r} != requested {args.core_ref!r}")

    for rel in REQUIRED_REPO:
        if not (ROOT / rel).is_file():
            fail(errors, f"missing repository file: {rel}")
    for rel in REQUIRED_SKILL:
        if not (SKILL / rel).is_file():
            fail(errors, f"missing skill file: {rel}")

    for path in SKILL.rglob("*"):
        if path.name == ".sot-tmp":
            fail(errors, f"generated directory inside skill/: {path.relative_to(SKILL)}")
        if path.is_symlink():
            fail(errors, f"symlink inside skill/: {path.relative_to(SKILL)}")

    text = (SKILL / "SKILL.md").read_text(encoding="utf-8")
    fields = parse_frontmatter(text)
    name = fields.get("name", "")
    description = fields.get("description", "")
    if not NAME_RE.fullmatch(name):
        fail(errors, f"SKILL.md name is not kebab-case: {name!r}")
    if compat.get("skill") != name:
        fail(errors, f"compat.json skill {compat.get('skill')!r} != SKILL.md name {name!r}")
    if not description:
        fail(errors, "SKILL.md description is empty")
    if len(description) > 500:
        fail(errors, f"SKILL.md description is {len(description)} chars (cap 500)")

    canonical = load_snapshot_tool()
    skill_digest, skill_count = canonical.snapshot(SKILL.resolve())
    replicated_digest, replicated_count = snapshot_tree(SKILL.resolve())
    if (skill_digest, skill_count) != (replicated_digest, replicated_count):
        fail(errors, "scoped snapshot implementation does not match scripts/snapshot_worktree.py")

    scope = compat.get("core_scope", [])
    core_digest, core_count = snapshot_tree(SKILL.resolve(), lambda rel: in_scope(rel, scope))

    computed = {
        "dsh_skill_snapshot": f"worktree-snapshot:{skill_digest}",
        "dsh_skill_files": skill_count,
        "core_snapshot": f"worktree-snapshot:{core_digest}",
        "core_files": core_count,
    }
    if args.print_only:
        print(json.dumps(computed, indent=2))
        return 0

    for key in ("core_snapshot", "dsh_skill_snapshot"):
        value = compat.get(key)
        if not isinstance(value, str) or not REVISION_RE.fullmatch(value):
            fail(errors, f"compat.json {key} must be worktree-snapshot:<64 hex>")
    if compat.get("core_snapshot") != computed["core_snapshot"]:
        fail(errors, f"compat.json core_snapshot does not match skill/ (computed {computed['core_snapshot']})")
    if compat.get("dsh_skill_snapshot") != computed["dsh_skill_snapshot"]:
        fail(errors, f"compat.json dsh_skill_snapshot does not match skill/ (computed {computed['dsh_skill_snapshot']})")

    package_path = BUNDLE / "package.json"
    if package_path.is_file():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        if package.get("name") != compat.get("bundle"):
            fail(errors, "bundle/package.json name does not match compat.json bundle")
        if package.get("version") != compat.get("bundle_version"):
            fail(errors, "bundle/package.json version does not match compat.json bundle_version")
        if package.get("dsh", {}).get("bundle", {}).get("patch") != "./cordis.patch.yml":
            fail(errors, "bundle/package.json must declare dsh.bundle.patch ./cordis.patch.yml")
        client_meta = package.get("dsh", {}).get("client", {})
        if client_meta.get("platform") != "web":
            fail(errors, "bundle/package.json must declare dsh.client.platform web")

    for locale in ("en", "zh"):
        locale_path = BUNDLE / "locale" / f"{locale}.json"
        if locale_path.is_file():
            data = json.loads(locale_path.read_text(encoding="utf-8"))
            meta = data.get("meta", {})
            if not meta.get("title") or not meta.get("description"):
                fail(errors, f"bundle/locale/{locale}.json needs meta.title and meta.description")

    icon = BUNDLE / "icon.svg"
    if icon.is_file() and icon.stat().st_size > 256 * 1024:
        fail(errors, "bundle/icon.svg exceeds 256 KiB")

    if errors:
        print("VALIDATION FAILED", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("VALIDATION PASSED")
    print(f"skill: {name} ({skill_count} files)")
    print(f"core_snapshot: {computed['core_snapshot']} ({core_count} files)")
    print(f"dsh_skill_snapshot: {computed['dsh_skill_snapshot']}")
    print(f"bundle: {compat['bundle']} {compat['bundle_version']}")
    print(f"compat: {compat['core_repo']} {compat['core_ref']} / DSH {compat['dsh_version_checked']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
