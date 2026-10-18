# dsh-self-organizing-agent-team

DeepSeek Harness distribution of the **self-organizing-agent-team** protocol, packaged the DSH-native way: a Cordis bundle that

- registers the `self-organizing-agent-team` skill from inside the package (no `~/.dsh/skills` copy required), and
- adds a read-only **Settings → Team Protocol** page showing the skill name, adapter, core pin, bundle version, and the DSH version it was verified against.

The protocol itself — risk routing, ownership, write scopes, review gates, revision-bound evidence, external-action authorization — is documented in [`skill/`](skill/) and is host-neutral except for the DSH adapter.

| Field | Value |
|---|---|
| Bundle | `@conflagrationj/dsh-self-organizing-agent-team` `0.2.0` |
| Adapter | `dsh-agent-team-v1` |
| Core skill | `ConflagrationJ/self-organizing-agent-team` @ `v0.1.0` |
| Verified against | DSH Desktop `44.7.0`, profile `desktop` |

## Layout

```text
skill/                 Canonical protocol skill (SKILL.md, references, templates, scripts, DSH adapter)
bundle/                Installable Cordis bundle: Host half registers the skill; Client half adds the Settings page
scripts/build.py       Assemble bundle/skill/ from skill/ and validate the package
scripts/validate_repo.py   Validate compat pins, snapshots, manifests, and required files
scripts/package.py     Produce deterministic dist archives and SHA256SUMS
scripts/release_notes.py   Render the release notes for a version
compat.json            Core/core-snapshot/DSH pins for this release
evidence/              Verification records shipped with the release
```

`bundle/skill/` and `dist/` are generated (`python scripts/build.py`, `python scripts/package.py`) and are not committed.

## Install (primary: tarball bundle)

The release ships an npm-style `.tgz` because the bundle depends on `@deepseek-ai/schemastery` for its plugin configuration; Plugin Manager installs that dependency from the registry when given the tarball.

1. Download `conflagrationj-dsh-self-organizing-agent-team-<version>.tgz` from the release.
2. Install that tarball as a bundle with DSH Plugin Manager.
3. Refresh the page if needed. The session catalog lists `self-organizing-agent-team`, Settings gains **Team Protocol**, and new sessions receive the protocol automatically.

For local development from this checkout: `python scripts/build.py`, then `npm pack` the `bundle/` directory and install the resulting tarball. Installing the `bundle/` folder directly links the checkout, in which case its `@deepseek-ai/schemastery` dependency cannot be resolved from the profile.

## Default auto-load

`autoLoad` (Host plugin configuration, default `true`) makes every newly created agent inherit an agent-scoped system-prompt section containing the skill instructions, including teammates and subagents. Turn it off in the plugin's configuration (Settings → Plugins → this bundle) to fall back to explicit invocation only; the change applies to agents created after the configuration is applied. Keep the catalog entry: even with auto-load off, `/self-organizing-agent-team` and the `skill` tool still work.

## Install (fallback: filesystem skill)

The bundle is the primary distribution. If you cannot install a bundle, extract `self-organizing-agent-team-skill-<version>.zip` into a scanned skill root:

```text
<project>/.dsh/skills/self-organizing-agent-team
~/.dsh/skills/self-organizing-agent-team
~/.agents/skills/self-organizing-agent-team
```

Do not install both: a filesystem skill is provided by the session's preset layer, which outranks the bundle's global runtime registration, so the fallback copy would silently shadow the bundle. When you switch to the bundle, delete the filesystem copy.

## Verify

```sh
python scripts/validate_repo.py            # compat pins, snapshots, manifests
python scripts/build.py                     # assemble bundle/skill
cd bundle/skill
python scripts/validate_task_contract.py templates/task-contract.md
python scripts/test_validate_task_contract.py
python scripts/test_forward_scenarios.py
```

Expected: `VALIDATION PASSED`, `STRUCTURAL VALIDATION PASSED`, `Ran 33 tests ... OK`, and `FORWARD STRUCTURE FIXTURES PASSED`.

## Compatibility pins

`compat.json` records:

- `core_ref` — the published core tag this release is based on;
- `core_scope` — the files inherited unchanged from the core skill repository, which `core_snapshot` hashes;
- `dsh_skill_snapshot` — the hash of the complete DSH skill, including DSH-owned files (`SKILL.md`, adapter docs, test scripts, snapshot tool);
- `dsh_version_checked` and `dsh_profile` — the environment used for verification.

`--core-ref <tag>` on the validator lets CI refuse a release whose pin does not match the requested core tag.

Core upgrades: take the new core tag, copy the files named by `core_scope`, re-apply DSH-owned overlays (the adapter docs and DSH-specific skill edits), run the checks above, then bump `core_ref` and both snapshots. Do not edit core-owned files in place without a matching `core_ref` change.

## Release

`.github/workflows/release.yml` is manual (`workflow_dispatch`) with a `dry_run` input that defaults to `true`. It validates the repo, assembles and tests the bundle, checks JavaScript syntax, packages the assets (installable tarball, inspection zip, skill fallback), renders release notes, verifies `SHA256SUMS`, and publishes `dsh-v<version>`. The job runs in the protected `release` environment, which is configured to require a reviewer (the repository owner) before any deployment, so a token alone cannot publish.

## Boundaries

- The core skill is maintained in `ConflagrationJ/self-organizing-agent-team`; this repository owns only the DSH distribution and its adapter.
- Repository scripts never mutate the DSH profile; installation is done through Plugin Manager with the user's approval.
- Agent Teams is an experimental DSH package family: tool schemas and composition can change between DSH releases. Compatibility is pinned per release, not promised across versions.
- The skill is a coordination protocol, not an enforcement layer. Write scopes are advisory; reviewer read-only is a protocol rule.

## License

MIT. The core skill is MIT too; see `LICENSE`.
