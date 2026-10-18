#!/usr/bin/env python3
"""Assemble `bundle/skill/` from `skill/` and validate the bundle package.

The repository keeps the protocol skill in `skill/` (the canonical source) and
assembles a copy inside the installable bundle at build time. Run this before
`plugin_manager` installs the bundle directory or before packaging a release.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL = ROOT / "skill"
BUNDLE = ROOT / "bundle"
TARGET = BUNDLE / "skill"
COMPAT = ROOT / "compat.json"

IGNORE = shutil.ignore_patterns("__pycache__", "*.pyc", ".sot-tmp", ".DS_Store")

FRONTMATTER = re.compile(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?")
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

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


def fail(message: str) -> None:
    raise SystemExit(f"build: error: {message}")


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = FRONTMATTER.match(text)
    if not match:
        fail("SKILL.md has no YAML frontmatter")
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        field = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$", line)
        if field:
            fields[field.group(1)] = field.group(2).strip().strip("'\"")
    return fields, text[match.end():]


def main() -> int:
    if not COMPAT.is_file():
        fail("compat.json is missing")
    compat = json.loads(COMPAT.read_text(encoding="utf-8"))

    if TARGET.exists():
        shutil.rmtree(TARGET)
    shutil.copytree(SKILL, TARGET, ignore=IGNORE)

    for path in TARGET.rglob("*"):
        if path.is_symlink():
            fail(f"bundle/skill must not contain symlinks: {path.relative_to(TARGET)}")

    fields, _body = parse_frontmatter((TARGET / "SKILL.md").read_text(encoding="utf-8"))
    name = fields.get("name", "")
    description = fields.get("description", "")
    if not NAME_RE.fullmatch(name):
        fail(f"SKILL.md name must be kebab-case: {name!r}")
    if name != compat.get("skill"):
        fail(f"SKILL.md name {name!r} != compat.json skill {compat.get('skill')!r}")
    if not description:
        fail("SKILL.md description is empty")
    if len(description) > 500:
        fail(f"SKILL.md description is {len(description)} chars; catalog cap is 500")

    for rel in REQUIRED_SKILL:
        if not (TARGET / rel).is_file():
            fail(f"missing required skill file: {rel}")

    (BUNDLE / "compat.json").write_text(
        COMPAT.read_text(encoding="utf-8"), encoding="utf-8", newline="\n"
    )

    package = json.loads((BUNDLE / "package.json").read_text(encoding="utf-8"))
    if package.get("name") != compat.get("bundle"):
        fail(f"bundle package name {package.get('name')!r} != compat.json bundle {compat.get('bundle')!r}")
    if package.get("version") != compat.get("bundle_version"):
        fail(f"bundle version {package.get('version')!r} != compat.json bundle_version {compat.get('bundle_version')!r}")

    client = (BUNDLE / "client.js").read_text(encoding="utf-8")
    literal = re.search(r"const COMPAT = JSON\.parse\('((?:[^'\\]|\\.)*)'\)", client)
    if not literal:
        fail("bundle/client.js: COMPAT literal not found")
    try:
        client_compat = json.loads(literal.group(1).replace("\\'", "'"))
    except json.JSONDecodeError as exc:
        fail(f"bundle/client.js: COMPAT is not valid JSON: {exc}")
    expected = {
        "adapter": compat.get("adapter"),
        "coreRepo": compat.get("core_repo"),
        "coreRef": compat.get("core_ref"),
        "bundleVersion": compat.get("bundle_version"),
        "dshVersionChecked": compat.get("dsh_version_checked"),
        "skillName": compat.get("skill"),
    }
    if client_compat != expected:
        fail(f"bundle/client.js COMPAT mismatch: {client_compat!r} != {expected!r}")

    file_count = sum(1 for path in TARGET.rglob("*") if path.is_file())
    print(f"bundle: {BUNDLE}")
    print(f"bundle/skill: {file_count} files")
    print(f"skill: {name} (description {len(description)} chars)")
    print(f"version: {package['version']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
