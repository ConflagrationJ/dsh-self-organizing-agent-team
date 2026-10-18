#!/usr/bin/env python3
"""Render the release notes for `dsh-v<version>` from compat.json and evidence."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Render DSH release notes.")
    parser.add_argument("--version", required=True, help="Bundle version, e.g. 0.1.0")
    parser.add_argument("--core-ref", help="Expected core tag; validated against compat.json")
    parser.add_argument("--output", help="Write to this path instead of stdout")
    args = parser.parse_args(argv)

    compat = json.loads((ROOT / "compat.json").read_text(encoding="utf-8"))
    if args.version != compat["bundle_version"]:
        raise SystemExit(f"release-notes: version {args.version!r} != compat.json {compat['bundle_version']!r}")
    if args.core_ref and args.core_ref != compat["core_ref"]:
        raise SystemExit(f"release-notes: core ref {args.core_ref!r} != compat.json {compat['core_ref']!r}")

    version = compat["bundle_version"]
    sha = os.environ.get("GITHUB_SHA", "local")
    evidence = ROOT / "evidence" / f"v{version}.md"

    lines = [
        f"# DSH v{version}",
        "",
        "Bundle for the **self-organizing-agent-team** skill on DeepSeek Harness Agent Teams. "
        "It registers the protocol skill from the package and adds a read-only **Settings → Team Protocol** page.",
        "",
        "## Compatibility",
        "",
        f"- Adapter: `{compat['adapter']}`",
        f"- Core skill: `{compat['core_repo']}` @ `{compat['core_ref']}`",
        f"- Core snapshot: `{compat['core_snapshot']}`",
        f"- DSH skill snapshot: `{compat['dsh_skill_snapshot']}`",
        f"- DSH version verified: `{compat['dsh_version_checked']}` (profile `{compat['dsh_profile']}`)",
        f"- Bundle: `{compat['bundle']}@{version}`",
        f"- Commit: `{sha}`",
        "",
        "## Assets",
        "",
        f"- `conflagrationj-dsh-self-organizing-agent-team-{version}.tgz` — **install this** with Plugin Manager; the tarball lets pnpm install the bundle's `@deepseek-ai/schemastery` dependency.",
        f"- `dsh-self-organizing-agent-team-bundle-{version}.zip` — the same bundle as a folder, for inspection and manual extraction.",
        f"- `self-organizing-agent-team-skill-{version}.zip` — optional filesystem-skill fallback for `~/.dsh/skills`.",
        "- `SHA256SUMS` — checksums for the assets above.",
        "",
        "## Install",
        "",
        "1. Download the `.tgz` asset.",
        "2. In DSH, install that tarball as a bundle with Plugin Manager.",
        "3. Refresh the page if needed. New sessions receive the protocol automatically; the session catalog lists `self-organizing-agent-team`, and Settings gains a **Team Protocol** page.",
        "4. To turn off the default load, edit the bundle's plugin configuration (`autoLoad = false`).",
        "5. Fallback only: extract the skill archive into `~/.dsh/skills/` (or `<project>/.dsh/skills/`), and remove it again before switching back to the bundle.",
        "",
        "## Default auto-load",
        "",
        "Unless `autoLoad` is disabled, the Host half adds an agent-scoped system-prompt section containing the skill instructions to every new agent. Disable it in the plugin configuration when you prefer explicit `/self-organizing-agent-team` invocation. Teammates and subagents are agents too, so they also receive the section.",
        "",
        "## Verification",
        "",
    ]
    if evidence.is_file():
        lines.append(evidence.read_text(encoding="utf-8").strip())
    else:
        lines.append("No evidence file was bundled with this release; see the repository `evidence/` directory.")

    notes = "\n".join(lines).rstrip() + "\n"
    if args.output:
        Path(args.output).write_text(notes, encoding="utf-8", newline="\n")
    else:
        sys.stdout.write(notes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
