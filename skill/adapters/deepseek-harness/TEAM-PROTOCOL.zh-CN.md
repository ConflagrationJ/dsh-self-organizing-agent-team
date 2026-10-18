[English](TEAM-PROTOCOL.md) | 中文

# DSH Team Protocol

这是面向 Lead 的 DeepSeek Harness（DSH）Agent Teams 协议。它把该 skill 受治理的团队模型适配到 DSH 的真实 tool 与限制上。

它不是 DSH plugin，不是官方认证，也不承诺 schema 稳定。在完整仓库中工作时，请阅读主 skill 的 `references/` 文件。DSH 自身的 Team 策略、审批流程和 sandbox 始终具有最高权威；本协议只增加风险路由与门禁。

检查依据：DSH Desktop 44.7.0，profile `desktop`，日期 2026-10-18。

## 1. 权限与角色

| 治理角色 | DSH 身份 | 职责 |
|---|---|---|
| 协调者 | `lead` | 风险路由、任务图、所有权、授权、最终验收 |
| Writer | 具名 teammate | 只实现被分配的 write scope |
| Reviewer | 具名 teammate | 计划红队与代码审查；按协议只读 |
| Executor | 具名 teammate | 运行已审查的 revision 并记录证据 |
| Analyst | 具名 teammate，可选 | 仅做可复现分析 |
| Monitor | 具名 teammate，可选 | 仅提供观察与风险信号 |

- 只有 Lead 可以调用 `spawn_teammate` 和 `interrupt_agent`；DSH 在执行时强制这一点。
- 不要创建嵌套团队。teammate 调用 `subagent`、`subagent_fork` 或任何其他委派 tool 都是停止条件。
- Lead 不得充当 writer、reviewer 或 executor。Lead 的职责是协调、阅读最终 diff、重跑最终检查并做出验收决定。
- 任何成员都可以给任何其他成员发消息并使用任务板。同伴消息不能替代任务所有权、审查独立性或 Lead 验收。
- 所有成员都获得同样的九个 tool；teammate 调用 Lead 专属操作时会失败。仍要在每个 spawn prompt 中写明该规则。

## 2. 前置条件与机制选择

1. 确认 composition：调用 `list_agents`；已挂载的 Team service 会返回 Lead 行。然后确认 `spawn_teammate`、`send_message`、`team_task_create`、`team_task_get`、`team_task_list`、`team_task_update`、`wait_agent` 以及（若已启用）`interrupt_agent`。
2. 如果缺少 Team tool，不要模拟团队。改用仅 Lead 路径，记录探测输出，并说明未创建团队。
3. 如果 Team tool 与 `subagent` / `subagent_fork` 同时可见，只使用 Team tool。`subagent` 子代理不是团队成员：它没有 `target`，不能拥有任务，也不能满足门禁。
4. 在 `host_capabilities.adapter` 中把机制记录为 `dsh-agent-team-v1`，并把探测输出作为 `detection.evidence`。

## 3. 风险路由与团队形态

证据混杂时选择更高的等级。

| 风险 | 团队 | 必需门禁 |
|---|---|---|
| 低 | 不用 teammate。Lead 实现、重读 diff、运行测试、记录证据。 | 范围检查、相关测试、证据 |
| 中 | 1 名 writer + 1 名 reviewer | 独立代码审查、测试 |
| 高 | 3 名 teammate：writer、reviewer、executor（适配器策略上限） | 写入前的计划审查、代码审查、独立执行、授权 |

- 适配器上限是三个 teammate。DSH 随发行版提供的 Desktop profile 允许 `maxMembers: 8`；package 默认值是 `16`。以更严格的策略为准。
- 不要给默认的高风险团队添加 analyst 或 monitor。只有当可选角色替代某个必需角色，或用户明确接受不同的团队形态时，才添加可选角色。
- 同一个 reviewer 可以同时做计划审查和代码审查。这样既保持人数上限，又保留 writer 与 reviewer 的分离。
- `spawn_teammate` tool 没有 model 参数，因此按角色选择 model 不在 tool 接口范围内。不要承诺每个角色使用不同的 model；如有需要，在 composition 层设置 model。
- 把 `team.max_agents` 设为 `0`（低）、`2`（中）或 `3`（高）。把 `team.max_parallel` 设为最多 `2`；DSH 没有并行上限，因此 Lead 通过把工作串行化到 `blocked_by` 下、并一次只给一个 writer 发消息来强制执行。

## 4. 启动顺序

1. 分类风险并选定 teammate 名称（lower-kebab-case、唯一、永久）。
2. 用 `team_task_create` 创建任务板任务，包含 `blocked_by` 和 `write_scopes`。
3. 用返回的 board id 作为 `task_id`、选定的名称作为 `team.assignments` 编写任务契约。
4. 用 `spawn_teammate` 只 spawn 需要的 teammate，并使用 `context: fresh`。
5. 向每个 teammate 发送其任务包：task id、board task id、基础快照、write scope、输入、门禁、停止条件以及本协议的路径。
6. 每次 `team_task_update` 之前，调用 `team_task_get` 并传入当前的 `expected_revision`。
7. 用 `wait_agent` 配合 `team_task_list` / `list_agents` 进行观察；每次等待后都要重新读取状态。
8. 验收前自己审查最终 diff、重新计算快照并运行最终测试。

高风险依赖链：

```text
plan-review task
  -> writer task
  -> code-review task
  -> executor task
  -> Lead acceptance
```

writer 不得在计划审查完成之前 claim writer 任务。executor 不得在代码审查通过之前 claim executor 任务。`blocked_by` 编码了这一点；DSH 会拒绝对未就绪任务的 claim。

`fresh` teammate 只知道自己的 system policy、初始 prompt 以及它读取的文件。`spawn_teammate` 会原样投递 prompt；它就是完整的初始任务。不要因为 Lead 读过协议就假定 teammate 也读过。

## 5. 任务板纪律

- 每个工作单元都使用 `team_task_create`。新任务无所有者且为 pending；DSH 分配诸如 `task-1` 的 id。
- 把人类可读标签放进 `subject`；保持契约中的 `task_id` 与 board id 一致。
- `write_scopes` 是 workspace 相对前缀。当两个进行中的任务计划写入重叠路径时，DSH 会给出警告且从不阻止写入；把该警告视为规划错误。
- 只有当每个 `blocked_by` 任务都完成时才 claim。先用 `team_task_get` 读取任务；再用 `expected_revision` 变更。
- 开始时 `claim`；未完成而放弃时 `release`；仅在附上证据后 `complete`；已审查 revision 变化时 `reopen`；仅当 Lead 决定所有权必须转移时 `reassign`；仅为了澄清范围才 `edit`；仅在重新检查 DAG 后才 `set_dependencies`；仅对过时任务 `delete`。
- `delete` 是 tombstone：它不是完成状态，且任务会从活动任务板上消失。
- 如果 DSH 报告 `TEAM_TASK_STALE_REVISION`，用 `team_task_get` 重读，重新计算变更，并重试一次。如果再次出现，停止并报告。
- 如果任务板报告 `TEAM_TASK_LIMIT`，清理过时任务（仅限不作为证据的任务）或缩小范围；不要删除证据。
- 所有者绝不会因为 teammate 变为 `inactive`、被中断、退出或失败而自动释放。Lead 必须显式 reassign、release 或 complete。

## 6. 审查独立性与门禁

在任何 writer 结论之前交付给 reviewer 的输入：

- 原始任务契约；
- 基础快照和冻结的已审查 revision；
- 原始 diff 或变更文件；
- 原始命令输出；
- 验收标准。

DSH 给每个成员相同的 tool；没有只读模式。reviewer 只读是由 Lead 强制执行的协议规则：

1. 在 reviewer 开始前计算快照（见第 8 节）。
2. 告诉 reviewer 只读并报告发现。
3. review 后重新计算快照。任何变化都会使该 review 失效：重新冻结 revision 并取得新的 review。
4. 在 review 文档中记录两个快照值和检查命令。

对于高风险，计划审查会在 writer 开始前检查数据边界、接口所有权、并发、锁、幂等性、权限、外部影响、失败恢复、验收标准以及未经验证的假设。

对于中风险和高风险，代码审查会检查确切的已审查 revision、路径边界、secrets/PII、空输入、超时、取消、重复执行、部分失败和回滚。

最多使用两轮 writer-reviewer。在第二轮仍未解决时，停止并升级。不要为了强行通过而增加第三轮或更多 teammate。

## 7. 消息、等待与中断

- `send_message` 成功只表示收件箱已接收。DSH 不重试、不去重，也不确认处理。
- 单条消息上限为 64 KiB。发送路径、哈希和简短摘录；把完整 diff 和日志放进 workspace 文件。
- 任何成员都可以给任何其他成员发消息；向自己发消息会被拒绝。
- `wait_agent` 等待下一次花名册、任务、消息接收或实时状态变化。它只报告变化或超时（10 秒到 1 小时）。当没有其他成员在运行或 provisioning 时，它会立即返回 `noProgress`；这意味着应发消息唤醒某人，而不是工作失败。
- `inactive` 表示没有 turn 在执行。teammate 通常在结束一个 turn 后变为 `inactive`，并可通过消息冷恢复。它不表示成功、失败或完成。
- `provisioning` 和 `failed` 描述成员创建状态。`failed` 的创建对该名称是终态，并且会消耗容量。
- `interrupt_agent` 只取消当前 turn，保留收件箱，且不释放任务所有权。用它处理失控的 turn，而不是当作“取消并清理”的操作。

## 8. 证据信封与 revision 绑定

每个证据项：

```json
{
  "task_id": "task-1",
  "base_rev": "worktree-snapshot:<64 hex characters>",
  "author": "executor",
  "artifact": "relative/path",
  "command": "exact command",
  "exit_code": 0,
  "timestamp": "2026-10-18T12:00:00Z",
  "scope": "what the evidence covers",
  "artifact_sha256": "64 hex characters or empty",
  "artifact_locator": "stable locator when hashing is impractical",
  "raw_output": "exact output or stable log locator"
}
```

可复现地计算 `base_rev`：

- Git 项目：`git rev-parse HEAD` 外加一个工作树哈希，并记录确切的命令与输出；或
- 无 VCS：从 bundle 运行 `python scripts/snapshot_worktree.py .`，它会对排序后的相对路径和文件字节打印 `worktree-snapshot:<sha256>`。

在 reviewer 开始前冻结快照。来自较旧 revision 的证据不能批准更新的 revision；review 后快照发生变化会使该次 review 失效。DSH 不会替你计算这些：由 executor 或 Lead 记录，Lead 重跑或验证最终检查。teammate 的一句“测试通过”不是验收证据。

## 9. 外部影响与授权

在任何具体的外部或不可逆操作之前，请求用户明确批准：

- 超出可丢弃 fixture 范围的本地删除或覆盖；
- Git 历史变更；
- 访问 secrets 或 PII；
- 网络、第三方 API、webhook、上传或抓取；
- 依赖安装；
- CI、发布、出版或 package registry 变更；
- 权限或身份变更；
- 支付或金融操作；
- 生产环境、迁移、批量数据变更或破坏性清理。

批准必须指明操作、目标、范围、可逆性、回滚方式以及任何有效期。批准不会跨任务、revision、payload 或目标沿用。DSH sandbox 权限不等于用户意图：sandbox 可能允许某条仍需批准的命令。若范围发生变化，停止并重新询问。

## 10. 停止与升级规则

在以下情况下立即停止：

- 某个外部操作缺少明确批准；
- reviewer 在 review 期间写入，或 review 后的快照不同；
- 已审查的 revision 与执行的 revision 不同；
- 同一个阻塞点在两轮内重复出现且没有新证据；
- 任务板报告反复出现过期 revision；
- 某个 teammate 的创建为 `failed`，或 Lead 声明必需的成员无法创建；
- teammate spawn 了嵌套子代理（`subagent` / `subagent_fork`）；
- Lead 无法检查最终 diff 或运行最终测试；
- 用户改变范围或撤销授权。

不要仅仅因为某个 teammate 处于 `inactive` 且没有成员在运行就停止：那是 turn 之间以及一个 turn 完成后的正常状态。唤醒欠下一步动作的成员，或执行 Lead 的下一步。只有当成员为 `failed`、必需的唤醒在两轮后仍无进展，或任务被阻塞且无所有者时才停止。

在两轮未解决的 writer-reviewer 之后，选择其一：拆分任务、重新规划、缩小范围，或询问用户。不要悄悄扩大团队。

## 11. 预算与超时

契约中的预算属于策略；DSH 没有针对单个 agent 的计时器。

- 契约未给出取值时的默认值：每个 teammate 30 分钟，总计 90 分钟，两轮无进展，两轮 writer-reviewer，两个并行 teammate。
- 通过以有界超时循环 `wait_agent` 并检查已用时间来落实每个 teammate 的预算。`wait_agent` 接受 10 秒到 1 小时。
- 预算到期时，对失控的 turn 调用 `interrupt_agent`（若已注册），记录最后状态并升级，而不是悄悄延长。
- 在以下情况下将一轮计为无进展：没有新的产物或证据，只有重复的结论，同一个阻塞点且没有变更的计划，成员超出预算而无结果，或证据无法与当前 revision 关联。

## 12. 必须保持可见的 DSH 限制

- 一个进程和一个共享工作目录。没有 worktree 隔离、合并步骤或文件锁。
- `write_scopes` 只是警告。Bash、formatter、生成器和直接写入都可能绕过所有权；由 Lead 检查最终 diff。
- 没有逐成员的只读权限。reviewer 只读是由快照比对支撑、由 Lead 强制执行的协议规则。
- `send_message` 成功是收件箱已接收，不是已处理；没有重试或去重。
- `inactive` 不是完成、失败或结束；任务所有者绝不会被自动释放。
- `interrupt_agent` 只取消 turn，保留收件箱，且不释放所有权；它在不同 composition 中是可选的。
- Team package 是实验性的，不承诺稳定性。
- `maxMembers` 会把创建失败计入；名称永不复用或删除。
- 过大的消息会被拒绝或必须拆分；把证据保存在文件中。
- Lead 必须检查最终 diff 并运行最终测试。团队状态或 writer 的总结不是验收证据。
