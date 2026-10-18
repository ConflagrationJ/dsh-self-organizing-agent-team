/**
 * Browser half of the bundle: a read-only Settings page that shows what the
 * bundle registered and which DSH/core versions it was verified against.
 *
 * Values in COMPAT are validated against ../../compat.json by the repository
 * build script; edit compat.json, then run `python scripts/build.py`.
 */

window.__ModuleLoader__.load({
  id: '@conflagrationj/dsh-self-organizing-agent-team',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const COMPAT = JSON.parse('{"adapter":"dsh-agent-team-v1","coreRepo":"ConflagrationJ/self-organizing-agent-team","coreRef":"v0.1.0","bundleVersion":"0.1.0","dshVersionChecked":"44.7.0","skillName":"self-organizing-agent-team"}')

    const NS = 'self-organizing-agent-team'

    const en = {
      navLabel: 'Team Protocol',
      title: 'Self-Organizing Agent Team',
      description: 'Governed multi-agent delivery protocol for DeepSeek Harness Agent Teams. Read-only compatibility page.',
      fieldSkill: 'Skill',
      fieldAdapter: 'Adapter',
      fieldCore: 'Core ref',
      fieldBundle: 'Bundle version',
      fieldDsh: 'Verified against',
      usage: 'Invoke with /self-organizing-agent-team in the composer, or let the model load the skill when a task matches its description. The protocol documents itself in the skill body and in adapters/deepseek-harness/TEAM-PROTOCOL.md.',
      compatHeading: 'Compatibility',
      usageHeading: 'How to use',
    }

    const zh = {
      navLabel: '团队协议',
      title: '自组织智能体团队',
      description: '面向 DeepSeek Harness Agent Teams 的受治理多智能体交付协议。本页为只读兼容信息页。',
      fieldSkill: '技能名',
      fieldAdapter: '适配器',
      fieldCore: '核心版本',
      fieldBundle: 'Bundle 版本',
      fieldDsh: '已验证版本',
      usage: '在输入框输入 /self-organizing-agent-team 调用，或让模型在任务匹配描述时自行加载。协议正文在技能内，详细操作见 adapters/deepseek-harness/TEAM-PROTOCOL.md。',
      compatHeading: '兼容性',
      usageHeading: '使用方式',
    }

    const heading = (text) => h('div', {
      style: {
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
        margin: '4px 0 2px',
      },
    }, text)

    const row = (label, value) => h('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: '12px',
        padding: '10px 0',
        borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
        fontSize: '13px',
        lineHeight: '20px',
      },
    }, h('div', { style: { color: 'var(--dsw-alias-label-secondary)' } }, label), h('div', {}, value))

    function Page({ t }) {
      return h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '4px 0 24px',
          color: 'var(--dsw-alias-label-primary)',
        },
      },
        h('div', { style: { fontSize: '16px', fontWeight: 600 } }, t('title')),
        h('div', {
          style: {
            fontSize: '13px',
            lineHeight: '20px',
            color: 'var(--dsw-alias-label-secondary)',
            marginBottom: '10px',
          },
        }, t('description')),
        heading(t('compatHeading')),
        row(t('fieldSkill'), COMPAT.skillName),
        row(t('fieldAdapter'), COMPAT.adapter),
        row(t('fieldCore'), COMPAT.coreRepo + ' @ ' + COMPAT.coreRef),
        row(t('fieldBundle'), COMPAT.bundleVersion),
        row(t('fieldDsh'), 'DSH ' + COMPAT.dshVersionChecked),
        heading(t('usageHeading')),
        h('div', {
          style: {
            fontSize: '13px',
            lineHeight: '20px',
            color: 'var(--dsw-alias-label-secondary)',
          },
        }, t('usage')),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'self-organizing-agent-team: locale')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'self-organizing-team',
          order: 30,
          label: () => t('navLabel'),
        }, () => h(Page, { t })))
      },
    }
  },
})
