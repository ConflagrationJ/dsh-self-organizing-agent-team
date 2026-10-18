# dsh-self-organizing-agent-team

DeepSeek Harness distribution of the **self-organizing-agent-team** protocol, packaged the DSH-native way: a Cordis bundle that

- registers the `self-organizing-agent-team` skill from inside the package (no `~/.dsh/skills` copy required), and
- adds a read-only **Settings → Team Protocol** page showing the skill name, adapter, core pin, bundle version, and the DSH version it was verified against.

The protocol itself — risk routing, ownership, write scopes, review gates, revision-bound evidence, external-action authorization — is documented in [`skill/`](skill/) and is host-neutral except for the DSH adapter.

| Field | Value |
|---|---|
| Bundle | `@conflagrationj/dsh-self-organizing-agent-team` `0.1.0` |
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

## Install (primary: bundle)

1. `python scripts/build.py`
2. In DSH, install the `bundle/` folder as a bundle (Settings → Plugins), or extract a release asset and install the extracted folder.
3. Refresh the page if the UI does not pick it up. The session catalog lists `self-organizing-agent-team`, and Settings gains **Team Protocol**.

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

`.github/workflows/release.yml` is manual (`workflow_dispatch`) with a `dry_run` input that defaults to `true`. It validates the repo, assembles and tests the bundle, checks JavaScript syntax, packages the assets, renders release notes, verifies `SHA256SUMS`, and publishes `dsh-v<version>` with the bundle asset, the skill fallback asset, and the checksums. The job runs in the `release` environment so repository protection rules can require a reviewer before publishing.

## Boundaries

- The core skill is maintained in `ConflagrationJ/self-organizing-agent-team`; this repository owns only the DSH distribution and its adapter.
- Repository scripts never mutate the DSH profile; installation is done through Plugin Manager with the user's approval.
- Agent Teams is an experimental DSH package family: tool schemas and composition can change between DSH releases. Compatibility is pinned per release, not promised across versions.
- The skill is a coordination protocol, not an enforcement layer. Write scopes are advisory; reviewer read-only is a protocol rule.

## License

MIT. The core skill is MIT too; see `LICENSE`.
