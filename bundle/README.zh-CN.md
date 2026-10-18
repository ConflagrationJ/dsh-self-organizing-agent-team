[English](README.md) | 中文

# @conflagrationj/dsh-self-organizing-agent-team

一个用于 **self-organizing-agent-team** 协议的 DeepSeek Harness Cordis bundle。

## 功能

- **Host 部分**（`index.js`）：从 package 中读取 `skill/SKILL.md`，校验其 frontmatter，并通过 `ctx.skills.register` 注册，因此会话目录和 `skill` tool 都直接由该 package 提供内容。加载后的正文会得到 `resourceBase: { kind: 'directory', path: '<package>/skill' }`，因此 references、templates 和 scripts 都在 bundle 内部解析。
- **默认自动加载**：除非 plugin 配置 `autoLoad` 为 `false`，每个新建 agent 都会得到一个 agent 作用域的 system-prompt 段落，其中包含该 skill 的指令，因此新会话无需手动 `/` 调用即可携带该协议。teammate 和 subagent 也是 agent，同样会收到该段落。
- **Client 部分**（`client.js`）：新增一个只读的 **Settings → Team Protocol** 页面（slot `settings.section`，id `self-organizing-team`），包含本地化文案和兼容性固定值。

除 Plugin Manager 创建的 bundle 行之外，本 package 在安装时不会修改任何 DSH profile。

## 文件

| 路径 | 用途 |
|---|---|
| `index.js` | Host plugin：注册打包的 skill |
| `client.js` | Client plugin：Settings 页面 |
| `cordis.patch.yml` | 插入 Host 行 |
| `skill/` | 完整的协议 skill，由 `../scripts/build.py` 从仓库的 `skill/` 组装 |
| `locale/en.json`、`locale/zh.json` | plugin 显示元数据 |
| `icon.svg` | bundle 的原创美术资源 |
| `compat.json` | 仓库兼容性固定值的副本 |

## 安装

用 DSH Plugin Manager 安装发行版的 `conflagrationj-dsh-self-organizing-agent-team-<version>.tgz`。必须使用 tarball，因为该 package 依赖 `@deepseek-ai/schemastery`；pnpm 会从 registry 安装该依赖。直接安装文件夹会链接 checkout，无法解析该依赖。

本地构建：在仓库根目录运行 `python scripts/build.py`，然后 `npm pack` 本目录并安装生成的 `.tgz`。

验证：

1. 会话目录列出 `self-organizing-agent-team`。
2. 新建 agent 的 context 包含 `<skill_content name="self-organizing-agent-team">`（自动加载；`autoLoad = false` 可禁用）。
3. Settings 中新增 **Team Protocol** 及兼容性表格。

## 配置

| 字段 | 默认值 | 含义 |
|---|---|---|
| `autoLoad` | `true` | 把协议指令加入每个新 agent 的 system prompt。在 bundle 行的 **Configure** 页面（Plugins → 本 bundle → 该行）修改；它只对之后创建的 agent 生效。 |

## 限制

- Agent Teams 是实验性的；Team tool schema 可能随 DSH 版本变化。
- 该 skill 是协调协议，不是强制执行层。`write_scopes` 仍然是建议性的，reviewer 只读仍然是协议规则。
- bundle 注册的是运行时 skill；位于更近层（项目 `.dsh/skills`，或 preset 作用域的用户根目录）的同名文件系统 skill 仍然优先。不要同时安装两者：使用 bundle 时删除文件系统副本。

## 许可证

MIT。协议内容来自 MIT 许可的核心 skill 仓库。
