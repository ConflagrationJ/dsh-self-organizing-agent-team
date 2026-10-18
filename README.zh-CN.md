[English](README.md) | 中文

# dsh-self-organizing-agent-team

`self-organizing-agent-team` 协议的 DeepSeek Harness 原生发行版：一个 Cordis bundle，

- 从包内注册 `self-organizing-agent-team` 技能（不需要再往 `~/.dsh/skills` 复制），
- 并在设置里增加一个只读的 **团队协议** 页面，显示技能名、适配器、核心版本、bundle 版本和验证过的 DSH 版本。

协议正文（风险分级、归属、写入范围、评审门禁、revision 绑定证据、外部动作授权）在 [`skill/`](skill/) 里；宿主无关，DSH 差异集中在 `skill/adapters/deepseek-harness/`。

## 安装（主路径：tarball bundle）

Release 提供 npm 风格的 `.tgz`：bundle 依赖 `@deepseek-ai/schemastery` 来提供插件配置，用 Plugin Manager 安装 tarball 时 pnpm 会从 registry 安装该依赖。

1. 下载 `conflagrationj-dsh-self-organizing-agent-team-<version>.tgz`
2. 在 DSH Plugin Manager 里把该 tarball 作为 bundle 安装
3. 需要时刷新页面。会话技能目录出现 `self-organizing-agent-team`，设置出现 **团队协议** 页，新会话自动带协议

直接安装 `bundle/` 目录会以 link 方式指向工作区，依赖无法从 profile 解析；本地开发请先 `python scripts/build.py`，再 `npm pack bundle/` 安装生成的 tarball。

## 默认自动加载

`autoLoad`（Host 插件配置，默认 `true`）会给每个新创建的 agent 增加一个 agent 级 system-prompt section，内容就是技能说明；teammate 和 subagent 也算新 agent，同样会带上。要回到“仅显式调用”，在插件配置里关掉 `autoLoad`，对之后创建的 agent 生效。关掉后 `/self-organizing-agent-team` 和 `skill` 工具仍然可用。

## 安装（fallback：技能目录）

解压 `self-organizing-agent-team-skill-<version>.zip` 到任一技能扫描根：

```text
<project>/.dsh/skills/self-organizing-agent-team
~/.dsh/skills/self-organizing-agent-team
~/.agents/skills/self-organizing-agent-team
```

## 校验

```sh
python scripts/validate_repo.py
python scripts/build.py
cd bundle/skill
python scripts/validate_task_contract.py templates/task-contract.md
python scripts/test_validate_task_contract.py
python scripts/test_forward_scenarios.py
```

## 兼容固定

`compat.json` 记录 `core_ref`、`core_scope`/`core_snapshot`、完整 DSH 技能快照 `dsh_skill_snapshot`、验证环境 `dsh_version_checked`/`dsh_profile`。CI 用 `--core-ref` 拒绝与请求核心 tag 不一致的发布。

核心升级流程：取新 core tag → 按 `core_scope` 同步文件 → 重新应用 DSH 自有覆盖（adapter 文档与 DSH 专属技能改动）→ 跑校验 → 更新 `core_ref` 与两个快照。

## 发布

`.github/workflows/release.yml` 手动触发，`dry_run` 默认 `true`；在受保护的 `release` environment 中运行，已配置要求仓库 owner 审批，token 本身不能直接发布。发布 `dsh-v<version>`，附带可安装 tarball、检查用 bundle zip、技能 fallback 包和 `SHA256SUMS`。

## 边界

- 核心 skill 仓库：`ConflagrationJ/self-organizing-agent-team`；本仓库只负责 DSH 发行版与适配层。
- 仓库脚本不修改 DSH profile；安装由 Plugin Manager 在用户授权下完成。
- Agent Teams 是实验性包族，工具 schema 与组合可能随 DSH 版本变化；兼容性按版本固定，不做跨版本承诺。
- 技能是协作协议，不是强制层：write scope 只是警告，reviewer 只读靠协议约束。

## 许可

MIT，见 `LICENSE`。
