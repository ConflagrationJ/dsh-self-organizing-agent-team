[English](README.md) | 中文

# DeepSeek Harness Adapter

本目录把该 skill 映射到 DeepSeek Harness（DSH）Agent Teams 上。它只是文档：不含任何 plugin 代码，也不改变 profile 状态。它是非官方且实验性的；DSH 的 tool schema、限制和 profile composition 可能随版本而变化。

检查依据：DSH Desktop 44.7.0，profile `desktop`，日期 2026-10-18。

## 1. 前置条件：Team composition 必须已挂载

Agent Teams 是一个实验性的 package 家族，并非默认能力。协议需要以下九个 tool，且全部限定于 Team 成员：

`spawn_teammate` · `send_message` · `list_agents` · `wait_agent` · `interrupt_agent` · `team_task_create` · `team_task_list` · `team_task_get` · `team_task_update`

在承诺组建团队之前先检查：

1. 调用 `list_agents`。已挂载的 Team service 会返回 Lead 行（`role: lead`）；否则该调用失败。
2. 确认上面九个 tool 名称均可调用。
3. 若任一检查失败，不要模拟团队。改用仅 Lead 的路径，把探测输出记录为 `host_capabilities.detection`，并说明未创建团队。

随发行版提供的 Desktop 应用已组合 `@deepseek-ai/dsh-experimental-agent-team-profile`，它会挂载持久会话存储（`@deepseek-ai/dsh-session-persistence-jsonl`）以及 `@deepseek-ai/dsh-experimental-agent-team`、`@deepseek-ai/dsh-experimental-tool-agent-team` 和 team UI 投影。在该 profile 中，`agent-team` 行配置为：

| 限制 | 随发行版提供的 Desktop 取值 | package 默认值 |
|---|---|---|
| `maxMembers` | `8` | `16` |
| `maxTasks` | `256` | `256` |
| `maxMessageBytes` | `65536` | `65536` |
| `disposalTimeoutMs` | `5000` | `5000` |

`maxMembers` 统计的是曾经创建过的每一个 teammate，包括创建失败的尝试。适配器自身的策略上限为三个 teammate，更为严格，也是本协议实际执行的限制。

要修改某个限制，在 profile 的 `cordis.patch.yml` 中覆盖 `agent-team` 行。要把 Agent Teams 加入其他 composition，请挂载 `agent-team` package README 中列出的那三个 package（持久存储是必需项）。profile 安装的确切命令行形式因 DSH 发行版而异，且随发行版提供的 Desktop 构建在 `PATH` 上不暴露 `dsh` 可执行文件；优先使用 profile bundle 定义或 plugin manager，而不是硬编码命令。不要把 plugin 源码复制进 workspace。

只有在启用后花名册 UI 仍未出现时，才刷新已打开的页面。真正重要的是这九个 tool 可被 Lead 调用。

## 2. 可能同时可见的两套委派机制

DSH 可以在同一 composition 中同时暴露上述 Team tool 和较早的 `subagent` / `subagent_fork` tool（在受检构建上，随发行版提供的 Desktop profile 即是如此）。它们不可互换：

| 机制 | 创建什么 | 花名册 / 所有权 | 任务板 | 是否适配本协议 |
|---|---|---|---|---|
| Team tools | 具名、持久的 teammate | 有 | 有 | 是 |
| `subagent` / `subagent_fork` | 匿名子代理 | 无花名册、无所有者 | 无 | 否 |

规则：

- 本协议中的每个委派角色都使用 Team tool。
- `subagent` 子代理不是团队成员：它没有 `target`，不能拥有任务，其结果也不满足任何 review 门禁。
- 告诉每个 teammate 不要调用 `subagent` 或 `subagent_fork`。创建嵌套子代理的 teammate 会破坏花名册、两轮上限以及“禁止嵌套委派”的不变量。把任何嵌套委派视为停止条件。
- 不要在同一个任务中混用机制；一个任务契约只在 `host_capabilities.adapter`（`dsh-agent-team-v1`）中列出一种委派机制。

## 3. 为 DSH 安装此 skill

DSH 以两种形式发现 skill：目录式 bundle `<name>/SKILL.md`，或直接位于某个被扫描根目录下的扁平文件 `<name>.md`。没有集中的注册表安装步骤。

| 优先级 | 根目录 | 说明 |
|---|---|---|
| 100 | `<project>/.dsh/skills` | 项目根目录是最近的包含 `.git` 的祖先目录，否则为当前工作目录 |
| 200 | `<project>/.agents/skills` | |
| 300 | 已配置的 `customSkillDirs` | |
| 400 | `<dshHome>/skills` | 本机上 `dshHome` 为 `C:\Users\<user>\.dsh` |
| 500 | `~/.agents/skills` | 共享的 agent 配置根目录 |
| 600 | 随发行版提供的 skill 目录 | 由 DSH 随发行版提供 |

把整个 `self-organizing-agent-team/` 目录（不只是 `SKILL.md`）复制到上述任一根目录，并保持目录名不变。`SKILL.md` 的资源（如 `references/`、`templates/` 和 `scripts/`）相对 bundle 的 base directory 解析。

重要：`~/.codex/skills/` **不是** DSH 的根目录之一。安装在 `C:\Users\<user>\.codex\skills\self-organizing-agent-team` 的 Codex 副本不会出现在 DSH 中。要么把 bundle 复制到某个 DSH 根目录，要么创建一个目录联接（junction），例如：

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\skills\self-organizing-agent-team" `
  -Target "$env:USERPROFILE\.codex\skills\self-organizing-agent-team"
```

验证：下一个会话的目录会列出 `self-organizing-agent-team`；更直接的检查是用该确切名称调用 `skill` tool。根目录监视使新 bundle 无需重启即可被发现。

### 仅显式调用

DSH 没有 `allow_implicit_invocation` 开关，且忽略 `agents/openai.yaml`（该文件是 Codex 的约定）。被发现的 skill 默认可由模型调用：模型看到其名称和经过截断的描述，并决定何时加载它。

如果你希望在 DSH 上采用 Codex 发行策略“仅显式调用”，请在已安装副本的 frontmatter 中加入这一行：

```yaml
disable-model-invocation: true
```

此后该 skill 会从模型目录中消失，而用户直接输入中的用户可调用 `/self-organizing-agent-team` token 仍会注入指令。每次安装选择一种策略并记录下来；不要依赖某个宿主去推断另一个宿主的策略。

## 4. 让协议可达

所有团队成员共享同一个工作目录，因此一份协议文件就足够。选项按优先级排列：

1. 让 Lead 读取本 bundle 中的 `TEAM-PROTOCOL.md`，并在每个 teammate 的 spawn prompt 中包含其路径。
2. 把 `TEAM-PROTOCOL.md` 复制到某个 workspace 路径（例如 `team-protocol.md`），并指定该单一副本为权威版本。
3. 在每个 spawn prompt 中内联重述要点。

`fresh` teammate 不继承 Lead 的任何对话，因此它只知道自己的 system policy、初始 prompt 以及它读取的文件。不要因为 Lead 读过协议就假定 teammate 也读过。teammate 在共享工作目录中运行，可以读取 Lead 点名的任何文件；如果其 tool 集暴露了 `skill` tool，成员也可能可以加载该 skill，但不要依赖这一点——请在 spawn prompt 中包含任务包和协议路径。

## 5. Tool 映射与注意事项

| Tool | 在协议中的角色 | 需遵守的 DSH 行为 |
|---|---|---|
| `spawn_teammate` | 创建 writer / reviewer / executor | 仅 Lead 可调用；`name` 为 lower-kebab-case、永久、永不复用；`context` 为 `fresh`（默认）或 `fork`；`prompt` 是 teammate 的完整初始任务 |
| `send_message` | 发送任务包、唤醒或发现 | 任意成员之间；成功仅表示收件箱已接收；不重试、不去重；消息上限 64 KiB；向自己发消息会被拒绝 |
| `list_agents` | 花名册、可用性、`target` 值 | `inactive` 表示没有 turn 在执行，而非成功或完成；`provisioning` 和 `failed` 描述创建状态 |
| `wait_agent` | 阻塞等待下一次团队变化 | 10 秒到 1 小时；只报告变化/超时；当没有其他成员在运行或 provisioning 时立即返回 `noProgress`；之后务必重新读取状态 |
| `interrupt_agent` | 停止失控的 turn | 仅 Lead 可调用；在随发行版提供的 Desktop profile 中已注册；取消当前 turn，但保留收件箱，且不释放任务所有权 |
| `team_task_create` | 一个工作单元 | 返回任务板分配的 id，如 `task-1`；新任务无所有者且为 pending |
| `team_task_list` | 仪表盘 | 可按 `status`、`owner`、`ready` 过滤；显示 revision、blocker、write-scope 警告 |
| `team_task_get` | 变更前读取 | 返回当前 revision |
| `team_task_update` | claim / release / complete / reopen / reassign / edit / set_dependencies / delete | 每次变更都是基于 `expected_revision` 的 compare-and-set；过期 revision 会被拒绝；`reassign` 仅 Lead 可调用；`delete` 是 tombstone，绝不是完成状态 |

`write_scopes` 是建议性的：当两个进行中的任务计划写入重叠路径时，DSH 会给出警告，但从不阻止写入。Bash、formatter、代码生成器和直接文件写入都可能绕过所有权。Lead 必须检查最终 diff。

## 6. 能避免大多数团队失败的 spawn 规则

- 对 writer、reviewer 和 executor 使用 `context: fresh`。`fork` 会继承 Lead 已完成的 turn，包括 Lead 已经从 writer 那里读到的任何内容，这会污染 reviewer 的独立性。仅对真正需要 Lead 上下文且不设门禁的工作保留 `fork`。
- 在编写契约之前选定所有名称：`team.assignments` 需要确切的 teammate `target` 值，而被创建失败占用的名称既不能复用也不能删除。
- 把完整任务包放进初始 `prompt`：task id、board task id、base revision、write scope、输入、门禁、停止条件以及协议副本的路径。`spawn_teammate` 会原样投递该 prompt。
- 所有成员都获得同样的九个 tool。Lead 专属操作在调用时强制，而不是靠隐藏 tool。明确告诉 teammate 不得 spawn 或 interrupt 成员。
- 创建失败会消耗 `maxMembers` 容量。按每个角色一次 spawn 规划，并让团队保持在三个 teammate 以内。

## 7. 任务板与契约

DSH 分配 task id（`task-<n>`）。任务契约的 `task_id` 应使用该 board id，这样契约、deck、handoff 和证据都指向同一个对象；把人类可读标签放进任务的 subject。由于 id 只有在创建后才存在，启动顺序为：

1. 分类风险并选定角色名称；
2. 为每个工作单元调用 `team_task_create`，包含 `blocked_by` 和 `write_scopes`；
3. 用返回的 id 和选定的名称编写任务契约；
4. spawn teammate 并向每个成员发送其任务包。

之后适用常规规则：每次变更前先调用 `team_task_get`，且绝不要覆盖更新的 revision。

任务板限制了任务 claim 能做什么：只有当所有 `blocked_by` 条目都完成时任务才可 claim，并且所有者绝不会因不活跃、被中断、进程退出或失败而被自动释放。Lead 必须显式 reassign、release 或 complete。已删除任务以 tombstone 形式保留，以保持 id 稳定。

## 8. 不依赖强制 VCS 的 revision 绑定

证据信封需要一个不可变的 `base_rev`。假定 Git 的 revision 格式无法在没有 `.git` 的 workspace 中执行。使用以下之一：

- 当项目是 Git 仓库时使用 `git rev-parse HEAD`（外加一个工作树哈希），并记录确切的命令与输出；或
- 使用随 bundle 提供的快照工具：

```powershell
python scripts/snapshot_worktree.py .            # prints worktree-snapshot:<sha256>
python scripts/snapshot_worktree.py . --json     # machine-readable
```

快照会对排序后的相对路径和文件字节取哈希，跳过 `.git`、`__pycache__`、`.dsh`、`.venv`、`node_modules` 和临时目录。对未变更的树运行两次会打印相同的值；任何编辑都会改变它。在 reviewer 开始前冻结快照，并在 review 后重新计算：值一旦变化，该次 review 即失效。

大 diff 和日志无法放进 64 KiB 的 team 消息。把它们写入 workspace 文件，然后发送定位符加上快照值。

## 9. 仍然存在的限制

- 只有一个共享工作目录。没有 worktree 隔离、合并步骤或文件锁。
- `write_scopes` 只会警告；它们不阻止写入。
- 没有逐成员只读模式。reviewer 只读是由 Lead 强制执行的规则；比较 review 前后快照，并使任何 review 期间的写入失效。
- `inactive` 不等于完成、失败或结束。一个结束 turn 的 teammate 通常会变为 `inactive`。
- 任务所有者绝不会被自动释放。
- `send_message` 的接收不等于处理；没有重试或去重。
- `wait_agent` 可能立即返回 `noProgress`；那并不表示 teammate 失败。
- `interrupt_agent` 在受检 profile 上已注册，但在不同 composition 中是可选的。
- Team package 是实验性的，不承诺稳定性；Desktop composition 可能随版本变化。
- Lead 必须检查最终 diff 并运行最终测试。teammate 的总结不是验收证据。

## 10. 给 DSH Lead 的复制粘贴 prompt

```text
1. You are the DSH Lead for this workspace.
2. Read TEAM-PROTOCOL.md from the adapter bundle before creating any teammate.
3. Classify the task as low, medium, or high risk under that protocol.
4. If the Team tools are unavailable, do not simulate a team: work as one agent, record the probe, and say no team was created.
5. If the risk is low, do not call spawn_teammate; work directly, then reread the diff, run the relevant tests, and record evidence.
6. If Agent Teams is mounted, use only the nine Team tools; do not use subagent or subagent_fork.
7. Create the board tasks first, then write the contract with the returned task ids as task_id.
8. Name the teammates in the contract and spawn them with context: fresh.
9. Put the full task package in each spawn prompt, including the protocol path.
10. For medium risk, spawn writer and reviewer. For high risk, spawn writer, reviewer, and executor; cap is three teammates.
11. Never let the Lead act as writer, reviewer, or executor; the Lead validates the final result.
12. Reviewer receives the contract, base snapshot, raw diff or files, and raw logs before any writer conclusion.
13. Compare the snapshot before and after review; any reviewer write invalidates the review.
14. High risk requires plan review before implementation and code review after implementation.
15. Require explicit user approval for each external side effect and irreversible action; DSH sandbox permission is not user intent.
16. Do not treat inactive as done and do not release owners automatically; reassign or complete explicitly.
17. After wait_agent returns, re-read list_agents, team_task_get, and team_task_list; noProgress means wake someone, not failure.
18. Stop on failed creation, a stale revision loop, a changed snapshot after review, or two unresolved writer-reviewer rounds.
19. Check the final diff and rerun the final tests yourself; do not rely on teammate summaries.
20. Report changed files, tests, blockers, and residual risk.
```

## 11. 契约字段映射

| 契约字段 | DSH 取值 |
|---|---|
| `task_id` | board id，例如 `task-1` |
| `host_capabilities.adapter` | `dsh-agent-team-v1` |
| `host_capabilities.detection.evidence` | 包含 `list_agents` / tool 列表探测输出的文件 |
| `team.coordinator` | `lead` |
| `team.assignments.writer/reviewer/executor` | teammate 的 `target` 名称，例如 `writer`、`reviewer`、`executor` |
| `team.max_agents` | `3`（高）、`2`（中）、`0`（低） |
| `team.max_parallel` | 最多 `2`；Lead 通过串行化 `blocked_by` 工作来强制执行 |
| `write_scope` | 传给 `team_task_create.write_scopes` 的 workspace 相对前缀 |
| `base_rev` | `worktree-snapshot:<sha256>`，或确切的 Git 命令与输出 |

## 12. 本适配器不做什么

- 它不实现、安装或配置任何 DSH plugin 或 profile。
- 它不会让 reviewer 变为只读、强制执行 write scope 或释放任务所有者。
- 它不替代 DSH 自身的 Team 策略、审批流程或 sandbox；该策略始终具有最高权威，本 skill 只增加风险路由和门禁。
