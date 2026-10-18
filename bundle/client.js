/**
 * Browser half of the bundle:
 * - a toggle on the Team Protocol settings page (`autoLoad`),
 * - a row configuration form for the same field (Plugins → bundle → Configure),
 * - a read-only compatibility table.
 *
 * Values in COMPAT are validated against ../../compat.json by the repository
 * build script; edit compat.json, then run `python scripts/build.py`.
 */

window.__ModuleLoader__.load({
  id: '@conflagrationj/dsh-self-organizing-agent-team',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const COMPAT = JSON.parse('{"adapter":"dsh-agent-team-v1","coreRepo":"ConflagrationJ/self-organizing-agent-team","coreRef":"v0.1.0","bundleVersion":"0.2.1","dshVersionChecked":"44.7.0","skillName":"self-organizing-agent-team"}')

    const NS = 'self-organizing-agent-team'
    const ROW_KEYS = [
      '@conflagrationj/dsh-self-organizing-agent-team#self-organizing-agent-team',
      '@conflagrationj/dsh-self-organizing-agent-team#include:self-organizing-agent-team',
    ]

    const en = {
      navLabel: 'Team Protocol',
      title: 'Self-Organizing Agent Team',
      description: 'Governed multi-agent delivery protocol for DeepSeek Harness Agent Teams.',
      fieldSkill: 'Skill',
      fieldAdapter: 'Adapter',
      fieldCore: 'Core ref',
      fieldBundle: 'Bundle version',
      fieldDsh: 'Verified against',
      fieldAutoLoad: 'Default auto-load',
      autoLoadOn: 'On — new sessions receive the protocol automatically.',
      autoLoadOff: 'Off — the protocol is only loaded through /self-organizing-agent-team.',
      autoLoadSummaryOn: 'Default auto-load: on',
      autoLoadSummaryOff: 'Default auto-load: off',
      autoLoadTitle: 'Load the protocol in new sessions',
      autoLoadDescription: 'Adds the skill instructions to every newly created agent (including teammates and subagents). Applies to agents created after the change.',
      autoLoadConfigureHint: 'The same switch is also on this bundle row\'s Configure page (Plugins).',
      compatHeading: 'Compatibility',
      usageHeading: 'How to use',
      usage: 'New sessions already carry the protocol when auto-load is on. You can also invoke /self-organizing-agent-team in the composer to load a fresh copy.',
    }

    const zh = {
      navLabel: '团队协议',
      title: '自组织智能体团队',
      description: '面向 DeepSeek Harness Agent Teams 的受治理多智能体交付协议。',
      fieldSkill: '技能名',
      fieldAdapter: '适配器',
      fieldCore: '核心版本',
      fieldBundle: 'Bundle 版本',
      fieldDsh: '已验证版本',
      fieldAutoLoad: '默认加载',
      autoLoadOn: '开 —— 新会话会自动收到协议。',
      autoLoadOff: '关 —— 只能通过 /self-organizing-agent-team 显式加载。',
      autoLoadSummaryOn: '默认加载：开',
      autoLoadSummaryOff: '默认加载：关',
      autoLoadTitle: '在新会话中加载协议',
      autoLoadDescription: '给每个新建 agent（包括 teammate 和 subagent）的 system prompt 增加技能说明。修改后对之后创建的 agent 生效。',
      autoLoadConfigureHint: '插件页里该 bundle 行的 Configure 页也有同一个开关。',
      compatHeading: '兼容性',
      usageHeading: '使用方式',
      usage: '自动加载开启时，新会话已自带协议；也可以在输入框输入 /self-organizing-agent-team 重新加载一份。',
    }

    /** Read the injected volatile `autoLoad` form state. */
    function useAutoLoadState(useAutoLoad) {
      const form = useAutoLoad ? useAutoLoad((snapshot) => snapshot) : undefined
      const enabled = form && form.value && typeof form.value.autoLoad === 'boolean' ? form.value.autoLoad : true
      const ready = Boolean(form) && form.status === 'ready' && form.writable !== false
      return { enabled, ready }
    }

    const AutoLoadSwitch = ({ t, enabled, ready, setAutoLoad }) => h('label', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 'none',
        cursor: ready ? 'pointer' : 'default',
        fontSize: '12px',
        color: enabled ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
      },
    },
      h('input', {
        type: 'checkbox',
        checked: enabled,
        disabled: !ready,
        onChange: (event) => setAutoLoad(event.target.checked),
        style: { width: '16px', height: '16px', accentColor: 'var(--dsw-alias-brand-primary, #2f7fd0)' },
      }),
      t(enabled ? 'autoLoadOn' : 'autoLoadOff'))

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

    function Page({ t, useAutoLoad, setAutoLoad }) {
      const { enabled, ready } = useAutoLoadState(useAutoLoad)
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
        heading(t('autoLoadTitle')),
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            padding: '4px 0 12px',
            borderBottom: '0.5px solid var(--dsw-alias-border-l2)',
          },
        },
          h('div', {
            style: {
              fontSize: '12px',
              lineHeight: '18px',
              color: 'var(--dsw-alias-label-secondary)',
            },
          }, t('autoLoadDescription')),
          h(AutoLoadSwitch, { t, enabled, ready, setAutoLoad })),
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
        h('div', {
          style: {
            fontSize: '12px',
            lineHeight: '18px',
            color: 'var(--dsw-alias-label-secondary)',
            marginTop: '6px',
          },
        }, t('autoLoadConfigureHint')),
      )
    }

    /** Row configuration form for `autoLoad`. */
    function AutoLoadConfig({ view, t, useAutoLoad, setAutoLoad }) {
      const { enabled, ready } = useAutoLoadState(useAutoLoad)
      if (view === 'summary') {
        return t(enabled ? 'autoLoadSummaryOn' : 'autoLoadSummaryOff')
      }
      return h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          padding: '12px 0',
          color: 'var(--dsw-alias-label-primary)',
        },
      },
        h('div', { style: { minWidth: 0 } },
          h('div', { style: { fontSize: '14px', lineHeight: '20px' } }, t('autoLoadTitle')),
          h('div', {
            style: {
              fontSize: '12px',
              lineHeight: '18px',
              color: 'var(--dsw-alias-label-secondary)',
              marginTop: '4px',
            },
          }, t('autoLoadDescription'))),
        h(AutoLoadSwitch, { t, enabled, ready, setAutoLoad }))
    }

    return {
      inject: ['slots', 'locale', 'configForms'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'self-organizing-agent-team: locale')
        const t = ctx.locale.bind(NS)

        const form = ctx.configForms.get(NS)
        const face = () => ({
          hooks: { autoLoad: form },
          setAutoLoad: (enabled) => form.set('autoLoad', enabled),
        })

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'self-organizing-team',
          order: 30,
          label: () => t('navLabel'),
          locale: NS,
          inject: face,
        }, Page))

        ctx.effect(
          () => ctx.configForms.whileServed([NS], () => {
            // Register the row form under both the patch id and the composed
            // loader entry id; the Plugins page dispatches whichever id it
            // records for the bundle row, and only the matching cell renders.
            const disposers = ROW_KEYS.map((key) => ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
              name: 'plugins.row.config',
              key,
              locale: NS,
              inject: face,
            }, AutoLoadConfig)))
            return () => { for (const dispose of disposers) dispose() }
          }),
          'self-organizing-agent-team: row config',
        )
      },
    }
  },
})
