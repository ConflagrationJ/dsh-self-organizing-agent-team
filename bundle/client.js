/**
 * Browser half of the bundle: a read-only Settings page that shows what the
 * bundle registered, whether auto-load is on by default, and which DSH/core
 * versions it was verified against.
 *
 * Values in COMPAT are validated against ../../compat.json by the repository
 * build script; edit compat.json, then run `python scripts/build.py`.
 */

window.__ModuleLoader__.load({
  id: '@conflagrationj/dsh-self-organizing-agent-team',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const COMPAT = JSON.parse('{"adapter":"dsh-agent-team-v1","coreRepo":"ConflagrationJ/self-organizing-agent-team","coreRef":"v0.1.0","bundleVersion":"0.2.0","dshVersionChecked":"44.7.0","skillName":"self-organizing-agent-team"}')

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
      fieldAutoLoad: 'Default auto-load',
      autoLoadOn: 'On — new sessions receive the protocol automatically. Turn it off in Settings → Plugins → this bundle → Auto-load.',
      compatHeading: 'Compatibility',
      usageHeading: 'How to use',
      usage: 'New sessions already carry the protocol. You can also invoke /self-organizing-agent-team in the composer to load a fresh copy, and disable the default in the plugin configuration.',
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
      fieldAutoLoad: '默认加载',
      autoLoadOn: '开 —— 新会话会自动收到协议。在 设置 → 插件 → 本 bundle → 自动加载 中可关闭。',
      compatHeading: '兼容性',
      usageHeading: '使用方式',
      usage: '新会话已自带协议；也可以在输入框输入 /self-organizing-agent-team 重新加载一份。要关闭默认加载，请改插件配置里的 autoLoad。',
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
        row(t('fieldAutoLoad'), t('autoLoadOn')),
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
