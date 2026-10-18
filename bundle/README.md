# @conflagrationj/dsh-self-organizing-agent-team

A DeepSeek Harness Cordis bundle for the **self-organizing-agent-team** protocol.

## What it does

- **Host half** (`index.js`): reads `skill/SKILL.md` from the package, validates its frontmatter, and registers it with `ctx.skills.register`, so the session catalog and the `skill` tool serve it from the package itself. The loaded body gets `resourceBase: { kind: 'directory', path: '<package>/skill' }`, so references, templates, and scripts resolve inside the bundle.
- **Default auto-load**: unless the `autoLoad` plugin configuration is `false`, every newly created agent gets an agent-scoped system-prompt section containing the skill instructions, so new sessions carry the protocol without a manual `/` invocation. Teammates and subagents are agents too and receive the same section.
- **Client half** (`client.js`): adds a read-only **Settings → Team Protocol** page (slot `settings.section`, id `self-organizing-team`) with localized copy and the compatibility pins.

No DSH profile is modified by this package at install time beyond the bundle row that Plugin Manager creates.

## Files

| Path | Purpose |
|---|---|
| `index.js` | Host plugin: register the packaged skill |
| `client.js` | Client plugin: Settings page |
| `cordis.patch.yml` | Inserts the Host row |
| `skill/` | Complete protocol skill, assembled by `../scripts/build.py` from the repository's `skill/` |
| `locale/en.json`, `locale/zh.json` | Plugin display metadata |
| `icon.svg` | Original bundle artwork |
| `compat.json` | Copy of the repository compatibility pins |

## Install

Install the release's `conflagrationj-dsh-self-organizing-agent-team-<version>.tgz` with DSH Plugin Manager. The tarball is required because the package depends on `@deepseek-ai/schemastery`; pnpm installs that dependency from the registry. Installing the folder directly links the checkout and cannot resolve the dependency.

For a local build: `python scripts/build.py` in the repository root, then `npm pack` this directory and install the resulting `.tgz`.

Verification:

1. The session catalog lists `self-organizing-agent-team`.
2. A newly created agent's context contains `<skill_content name="self-organizing-agent-team">` (auto-load; `autoLoad = false` disables it).
3. Settings gains **Team Protocol** with the compatibility table.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `autoLoad` | `true` | Add the protocol instructions to every new agent's system prompt. Change it in the plugin configuration; it applies to agents created afterwards. |

## Limits

- Agent Teams is experimental; the Team tool schemas can change between DSH releases.
- The skill is a coordination protocol, not an enforcement layer. `write_scopes` remain advisory and reviewer read-only remains a protocol rule.
- The bundle registers a runtime skill; a filesystem skill with the same name in a nearer layer (project `.dsh/skills`, or the preset-scoped user roots) still wins. Do not keep both installed: delete the filesystem copy when using the bundle.

## License

MIT. The protocol content comes from the MIT-licensed core skill repository.
