/**
 * Host half of the bundle: register the packaged protocol skill.
 *
 * The skill lives in `skill/` beside this module, so the bundle is
 * self-contained: the catalog entry, the loaded body, and the resource base
 * directory all come from the package, and no copy under `~/.dsh/skills` is
 * required.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = dirname(fileURLToPath(import.meta.url))
const skillDir = join(packageDir, 'skill')
const skillFile = join(skillDir, 'SKILL.md')

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Services this plugin needs before it can activate. */
export const inject = ['skills']

/** Parse the small YAML subset used by skill frontmatter. */
function parseFrontmatter(text) {
  const match = FRONTMATTER.exec(text)
  if (!match) throw new Error(`self-organizing-agent-team: ${skillFile} has no frontmatter`)
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line)
    if (!field) continue
    fields[field[1]] = field[2].trim().replace(/^(['"])([\s\S]*)\1$/, '$2')
  }
  return { fields, body: text.slice(match[0].length) }
}

/** Register the protocol skill once per Host composition. */
export function apply(ctx) {
  const text = readFileSync(skillFile, 'utf8')
  const { fields, body } = parseFrontmatter(text)
  const { name, description, whenToUse } = fields
  if (!name || !description) {
    throw new Error(`self-organizing-agent-team: ${skillFile} needs name and description`)
  }
  ctx.effect(
    () => ctx.skills.register({
      name,
      description,
      ...(whenToUse ? { whenToUse } : {}),
      content: body,
      path: skillFile,
      resourceBase: { kind: 'directory', path: skillDir },
      source: 'bundled',
      invocation: { modelInvocable: true, userInvocable: true },
    }),
    'self-organizing-agent-team: skill',
  )
}
