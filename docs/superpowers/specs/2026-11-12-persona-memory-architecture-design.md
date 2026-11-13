# 角色记忆与蒸馏架构设计

## 意图

让 MetaSelf 根据聊天记录生成可审计、可导出、可迁移的角色资料，使任意支持文本或 Character Card 的 LLM 都能扮演 `bc` 或“我”。这里的“蒸馏”是提示词级资料编译，不训练模型权重，也不部署新模型。

## 目标

- 原始聊天永远是事实源；AI 提取只能作为带证据的观察。
- 将“像谁”和“记得发生过什么”分成独立层：资料、风格样例、历史会话。
- 导出通用 `persona.json`、`examples.jsonl` 和 Character Card V2 JSON。
- 保留当前本地会话检索；为后续接入 Supermemory/Zep 保留后端边界。
- 旧版本 `PersonaPack` 能继续读取，不要求数据库迁移。

## 非目标

- 不训练或微调任何模型。
- 不在本地引入向量数据库、模型服务或新的部署进程。
- 不把试聊生成的 assistant 回复写回真人记忆。
- 不把没有证据的推断导出为事实。

## 方案对比

1. **只生成一段长 Prompt**：改动小，但无法区分事实、风格和历史证据，迁移与纠错困难，放弃。
2. **只接入托管记忆服务**：可快速得到画像和检索，但聊天记录会外发、供应商绑定强，且无法替代本地原文证据，作为可选后端而不是默认数据源。
3. **本地事实源 + 分层蒸馏包 + 可插拔检索后端**：保留原文和证据，可导出给任意 LLM，默认零部署；选定此方案。

## 设计

`PersonaPack` 增加一个派生的 `profile` 层：将已有带证据 claims 按事实、表达、反应、关系分组，并保留证据 ID、可用时间和 caveat。`examples` 作为独立风格层，历史会话检索作为运行时上下文层。Prompt 按以下顺序组织：角色规则 → 精简 profile → 风格样例 → 相关原始会话 → 当前试聊。

便携导出遵循 Character Card V2 的兼容字段，同时在 `extensions.metaSelf` 中保留角色、截止日期、资料覆盖和证据摘要。角色卡只承载可供 LLM 使用的资料，不把评测样本或整份原始档案塞入卡片。

记忆后端定义为纯接口；默认实现仍为本地会话检索。未来可在不改角色 Prompt 和导出格式的情况下接入 Supermemory/Zep，外部后端返回的内容必须标记为检索数据，不能提升为系统指令或无证据事实。

## 验收

- 旧 pack 没有 `profile` 时可以即时派生，不报错。
- profile 每项都能追溯到 claims 的 evidence。
- Character Card V2 JSON 包含 name、description、personality、scenario、mes_example、system_prompt、post_history_instructions。
- 导出包含 `character-card.json`，但 `evaluation.json` 不进入角色 Prompt。
- 现有角色提取、检索、盲测验证继续通过。
