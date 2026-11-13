# 角色记忆与蒸馏架构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将角色模拟升级为可审计的分层蒸馏包，并导出可迁移的 Character Card V2，同时保留本地检索为默认运行时。

**Architecture:** 在 `persona-core` 旁增加纯函数蒸馏模块，按 claims 生成 profile 和 Character Card；现有 PersonaPack 通过可选字段向后兼容。后续记忆服务通过独立接口接入，当前不要求外部 key 或部署服务。

**Tech Stack:** Next.js 16、React、TypeScript、Prisma JSON、现有 `tsx` 验证脚本。

**Spec:** `docs/superpowers/specs/2026-11-12-persona-memory-architecture-design.md`

## Global Constraints

- 原始聊天是事实源，模型观察必须携带 evidence。
- 不训练模型，不增加本地模型、向量库或部署进程。
- 旧版 PersonaPack 必须可读取。
- 评测样本不得进入角色 Prompt 或角色卡。

## Review Focus

- 旧报告没有 `profile` 时，读取、聊天和导出不能报错。
- claims 存在重复、无证据或低置信 caveat 时，profile 不得制造新事实。
- 中英文和空文本样例不会破坏 Character Card JSON。
- 角色为 `self` 时，人物和对话对象的 speaker 映射不能反转。
- 角色卡导出不能混入 tests 或当前试聊 assistant 草稿。

### Task 1: 分层蒸馏纯函数

**Files:**
- Create: `src/lib/relation/persona-distillation.ts`
- Test: `scripts/verify-persona-distillation.ts`

**Interfaces:**
- Consumes: `PersonaPack`, `Claim`, `Example` from `src/lib/relation/persona-core.ts`.
- Produces: `PersonaProfile`, `CharacterCardV2`, `buildPersonaProfile(pack)`, `buildCharacterCard(pack)`, `portablePackage(pack)`.

- [ ] **Step 1: Write the failing test**
  - Assert old pack without `profile` derives grouped facts/styles/relationships.
  - Assert card has required V2 fields and excludes `tests`.
  - Assert speaker labels differ correctly for `self` and `other`.
- [ ] **Step 2: Run `npx tsx scripts/verify-persona-distillation.ts` and verify it fails because the module is missing.**
- [ ] **Step 3: Implement the pure types and builders.**
- [ ] **Step 4: Run the script and verify all assertions pass.**
- [ ] **Step 5: Commit the task changes.**

### Task 2: 接入 PersonaPack、Prompt 与导出

**Files:**
- Modify: `src/lib/relation/persona-core.ts`
- Modify: `src/app/actions/persona.ts`
- Modify: `src/components/relation/persona-panel.tsx`
- Modify: `docs/persona-simulation.md`
- Test: `scripts/verify-persona.ts`, `scripts/verify-persona-distillation.ts`

**Interfaces:**
- Consumes: Task 1 builders.
- Produces: Pack claims update profile; Prompt uses profile + style + source boundary; JSON export includes `character-card.json` and `profile.json`.

- [ ] **Step 1: Write failing assertions for `personaPrompt` using profile sections and for export containing `character-card.json`.**
- [ ] **Step 2: Run the focused scripts and verify the new assertions fail.**
- [ ] **Step 3: Add optional profile fields and wire builders after pack creation/claim updates.**
- [ ] **Step 4: Update portable prompt and browser download payload without exposing tests as character context.**
- [ ] **Step 5: Run persona and distillation scripts.**
- [ ] **Step 6: Commit the task changes.**

### Task 3: 可插拔记忆后端边界

**Files:**
- Create: `src/lib/relation/persona-memory.ts`
- Test: `scripts/verify-persona-memory.ts`
- Modify: `docs/persona-simulation.md`

**Interfaces:**
- Consumes: local `retrievePersonaSessions` output and a future hosted memory client.
- Produces: `PersonaMemoryBackend`, `localPersonaMemoryBackend`, `getPersonaMemoryBackend` with local default and optional provider selection.

- [ ] **Step 1: Write failing tests for local backend retrieval and disabled external provider fallback.**
- [ ] **Step 2: Run the script and verify it fails because the boundary is missing.**
- [ ] **Step 3: Implement the local backend boundary with no network calls.**
- [ ] **Step 4: Add environment-gated provider metadata without making the default path depend on it.**
- [ ] **Step 5: Run the memory, persona, retrieval, and TypeScript checks.**
- [ ] **Step 6: Commit the task changes.**

### Task 4: Final verification

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npx eslint src/lib/relation/persona-core.ts src/lib/relation/persona-distillation.ts src/lib/relation/persona-memory.ts src/app/actions/persona.ts src/components/relation/persona-panel.tsx`.
- [ ] Run `npx tsx scripts/verify-persona.ts`.
- [ ] Run `npx tsx scripts/verify-persona-retrieval.ts`.
- [ ] Run `npx tsx scripts/verify-persona-distillation.ts`.
- [ ] Run `npx tsx scripts/verify-persona-memory.ts`.
- [ ] Run `git diff --check`.
