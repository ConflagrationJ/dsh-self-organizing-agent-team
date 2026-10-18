/**
 * Host half of the bundle: register the packaged protocol skill and, unless
 * disabled in the plugin configuration, load its instructions into every new
 * agent by default.
 *
 * Auto-load adds one agent-scoped system-prompt section per agent. It is a
 * profile-level default: the toggle is `autoLoad` in this plugin's Config, and
 * it takes effect for agents created after the configuration is applied.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'

const packageDir = dirname(fileURLToPath(import.meta.url))
const skillDir = join(packageDir, 'skill')
const skillFile = join(skillDir, 'SKILL.md')

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const SECTION_NAME = 'self-organizing-agent-team'

/** Services this plugin needs before it can activate. */
export const inject = ['skills', 'systemPrompt']

/** Plugin configuration shown by Plugin Manager. */
export const Config = z.object({
  autoLoad: z.boolean().default(true),
})

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

/** Render the same envelope the `skill` tool returns. */
function renderSkillContent(name, body) {
  return [
    `<skill_content name="${name}">`,
    '<skill_resources>',
    `Base directory for this skill: ${skillDir}`,
    'Resolve relative paths mentioned by this skill against the base directory before using them. Load referenced resources only as needed.',
    '</skill_resources>',
    '',
    '<skill_instructions>',
    body.trim(),
    '</skill_instructions>',
    '</skill_content>',
  ].join('\n')
}

/** Register the protocol skill, then optionally load it into new agents. */
export function apply(ctx, config = {}) {
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
      source: 'runtime',
      invocation: { modelInvocable: true, userInvocable: true },
    }),
    'self-organizing-agent-team: skill',
  )

  if (config.autoLoad === false) return

  const sectionText = [
    'This session has the self-organizing-agent-team skill loaded by default.',
    'Do not call the `skill` tool for it again in this session; treat the instructions below as already loaded.',
    '',
    renderSkillContent(name, body),
  ].join('\n')

  ctx.on('agent/created', ({ agent }) => {
    agent.ctx.effect(
      () => agent.ctx.systemPrompt.section({
        name: SECTION_NAME,
        order: 500,
        text: sectionText,
      }),
      'self-organizing-agent-team: auto-load prompt section',
    )
  })
}
