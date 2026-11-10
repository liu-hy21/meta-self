# Relation Deep Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将关系模块重构为多页面深度工作台，加入 bc 人物、聊天原文查看、本地数据分析和可选 Codex/OpenAI 兼容 AI 分析。

**Architecture:** 保留现有 App Router、Prisma 与左侧导航；关系人物和分析报告存数据库，聊天原文由服务端从本地 Markdown 档案按需解析，客户端只接收分页后的消息与指标 DTO。新增人物详情、原文、数据分析、AI 分析路由，并用共享人物上下文导航串起来。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Tailwind CSS v4、Prisma、现有 OpenAI 兼容 LLM 配置。

**Spec:** `docs/superpowers/specs/2026-11-10-relation-deep-workbench-design.md`

## Global Constraints

- 当前产品按单用户本机应用处理；bc 档案默认读取 `bc_chat_2026-07_to-2026-10.md`，不依赖浏览器上传。
- 展示与计算统一使用 `Asia/Shanghai`，日期范围为闭区间。
- 会话段按相邻消息间隔 45 分钟切分；系统消息不计入双方占比和回复间隔，媒体占位符计入消息量。
- 关系温度由本地确定性基线计算，AI 只解释变化、主题与不确定性。
- 敏感聊天内容只在服务端按需读取，不进入客户端静态 bundle；不修改微信原始目录。
- 不新增大型图表依赖，图表使用 SVG/CSS。

## Review Focus

- 缺失或移动的本地聊天档案 → 人物页显示“档案不可用”，原文/分析页不 500；Task 1。
- Markdown 中包含换行、反引号、媒体占位符或非中文内容 → 解析和导出保持原文边界；Task 1。
- 45 分钟边界、跨午夜、同方连续消息 → 会话和回复间隔定义稳定；Task 1。
- bc 重复初始化、已有同源人物、未配置模型 → 幂等、可读状态，不创建重复记录；Task 2/4。
- 空人物或无消息时间范围 → 页面显示空状态，图表不出现 NaN 或破损 SVG；Task 3。

### Task 1: 聊天档案读取与指标计算

**Files:**
- Create: `src/lib/relation/types.ts`
- Create: `src/lib/relation/chat-archive.ts`
- Create: `src/lib/relation/metrics.ts`
- Create: `scripts/verify-relation-archive.ts`
- Modify: `.gitignore`

**Interfaces:**
- `loadChatArchive(sourceKey: string, range?: DateRange): Promise<ChatArchivePage>`
- `getChatArchiveMeta(sourceKey: string): Promise<ChatArchiveMeta>`
- `buildRelationMetrics(messages: ChatMessage[], timezone: string): RelationMetrics`
- `ChatMessage` includes `id`, `time`, `sender`, `isSelf`, `kind`, `text`, `day`.

- [ ] **Step 1: Write the archive verification script** asserting bc metadata, 11,114 total messages, inclusive 2026-07-01..2026-10-31 range, and no out-of-range messages.
- [ ] **Step 2: Run `npx tsx scripts/verify-relation-archive.ts` and confirm it fails before the reader exists.**
- [ ] **Step 3: Implement UTF-8 Markdown parsing in `chat-archive.ts`** with env override `RELATION_BC_ARCHIVE_PATH`, default project-root filename, stable `msg-000001` IDs, range/search/sender/kind filters, page cursor, and a clear missing-file error result.
- [ ] **Step 4: Implement `metrics.ts`** with 45-minute session segmentation, message totals, sender share, active days, hour heatmap, weekly trend, response median/P90, session length and type distribution; exclude system messages from reciprocity and response metrics.
- [ ] **Step 5: Run `npx tsx scripts/verify-relation-archive.ts` and confirm PASS with 11,114 messages and stable first/last IDs.**
- [ ] **Step 6: Add `bc_chat_*.md` to `.gitignore` while keeping the existing local file usable.**

### Task 2: Prisma relation archive/report model and bc initialization

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_relation_deep_workbench/migration.sql`
- Modify: `src/app/actions/data.ts`
- Create: `src/lib/relation/people.ts`
- Create: `src/lib/relation/archive-config.ts`

**Interfaces:**
- `ensureBcPerson(userId: string): Promise<RelationPersonWithArchive>`
- `listRelationPeople(userId: string): Promise<RelationPersonWithArchive[]>`
- `getRelationPerson(userId: string, personId: string): Promise<RelationPersonWithArchive | null>`
- `RelationChatArchive` stores source type/key, archive path, period, message count, importedAt.
- `RelationAiReport` stores person, period, model, status, contentMarkdown, evidenceJson, errorMessage, createdAt.

- [ ] **Step 1: Add the two archive/report Prisma models and archive relation fields** with indexes and no destructive changes to existing relation tables.
- [ ] **Step 2: Generate the migration with `npx prisma migrate dev --name relation_deep_workbench`** and confirm the generated SQL only creates the new tables/columns.
- [ ] **Step 3: Implement `ensureBcPerson`** using `sourceType=WECHAT` and `sourceKey=wxid_en8z2t73paw522` as the idempotency key; attach FRIEND kind and archive metadata.
- [ ] **Step 4: Add server-side relation queries and revalidation paths** for the new pages and existing relation entry.
- [ ] **Step 5: Run `npx prisma generate` and a seed/first-page smoke check** confirming exactly one bc person for the current user.

### Task 3: Multi-page relation UI and navigation

**Files:**
- Create: `src/app/(main)/relation/people/[personId]/page.tsx`
- Create: `src/app/(main)/relation/chat/[personId]/page.tsx`
- Create: `src/app/(main)/relation/analysis/[personId]/page.tsx`
- Create: `src/app/(main)/relation/analysis/[personId]/ai/page.tsx`
- Create: `src/components/relation/relation-workbench-nav.tsx`
- Create: `src/components/relation/people-list.tsx`
- Create: `src/components/relation/chat-reader.tsx`
- Create: `src/components/relation/metrics-dashboard.tsx`
- Create: `src/components/relation/ai-analysis-panel.tsx`
- Modify: `src/app/(main)/relation/profile/page.tsx`
- Modify: `src/components/shell/left-rail.tsx`
- Modify: `src/components/shell/top-bar.tsx`

**Interfaces:**
- People page links use `/relation/people/[personId]`, `/relation/chat/[personId]`, `/relation/analysis/[personId]`, `/relation/analysis/[personId]/ai`.
- `ChatReader` consumes `ChatArchivePage` and renders day groups plus filters.
- `MetricsDashboard` consumes `RelationMetrics` and renders cards/heatmap/SVG trends.

- [ ] **Step 1: Replace the relation profile body** with person management, bc card, archive status, quick interaction entry, and empty/loading/error states.
- [ ] **Step 2: Add shared person navigation** with active route state and period badge; update top-bar titles and left-rail relation link behavior.
- [ ] **Step 3: Implement the person detail page** with summary, latest interactions, archive coverage, and entry points.
- [ ] **Step 4: Implement the original chat reader** with date range preset, keyword search, sender/type filters, day anchors, pagination cursor, and raw text/media placeholders.
- [ ] **Step 5: Implement the data analysis page** with metric cards, SVG weekly trend, 24-hour heatmap, response/session panels, type distribution, and topic keywords.
- [ ] **Step 6: Run the dev server and manually verify all four routes** at desktop and narrow widths; confirm the 11,114-message count never renders the full archive in one client payload.

### Task 4: Codex/OpenAI-compatible AI analysis

**Files:**
- Modify: `src/lib/relation/ai-analysis.ts`
- Modify: `src/app/actions/data.ts`
- Modify: `src/app/(main)/relation/analysis/[personId]/ai/page.tsx`
- Modify: `src/components/relation/ai-analysis-panel.tsx`
- Create: `src/lib/relation/ai-prompt.ts`

**Interfaces:**
- `generateRelationAiReport(userId: string, personId: string, range: DateRange): Promise<RelationAiReportView>`
- `buildRelationAiContext(messages: ChatMessage[], metrics: RelationMetrics): RelationAiContext`
- `RelationAiReportView` includes status, generatedAt, model, sections, evidenceIds, and error.

- [ ] **Step 1: Write the prompt/context builder** that sends computed metrics plus bounded message excerpts, requests temperature interpretation, communication tendencies, topics, turning points, signals, next step, confidence and evidence IDs.
- [ ] **Step 2: Implement server-side model invocation** using `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, a 60-second timeout, and no client-side key exposure.
- [ ] **Step 3: Persist successful and failed report versions** in `RelationAiReport`; keep previous versions and show newest by default.
- [ ] **Step 4: Add the generate/retry UI** with explicit data-sharing notice, loading state, no-key state, failure state and evidence links back to the chat reader.
- [ ] **Step 5: Verify with no LLM key** that the page still renders local metrics and a disabled analysis state; with a configured endpoint, verify a report is persisted without exposing the key.

### Task 5: Visual polish, accessibility, and verification

**Files:**
- Modify: `src/app/globals.css`
- Modify: relation components from Tasks 3–4 as needed
- Modify: `src/components/shell/evidence-rail.tsx` only if relation evidence links need a shell integration

- [ ] **Step 1: Add the relationship research-desk visual system** using deep ink-green, warm paper surfaces, coral temperature accents, fine grid texture, readable CJK type scale, and restrained motion.
- [ ] **Step 2: Add keyboard focus, semantic headings, labels, reduced-motion handling, and mobile stacking** for all new controls.
- [ ] **Step 3: Run `npm run lint` and fix all errors.**
- [ ] **Step 4: Run `npm run build` and fix all type/route/Prisma errors.**
- [ ] **Step 5: Verify acceptance criteria**: bc appears once, routes deep-link, archive filters stay in range, metrics match the export, AI no-key state is safe, and original data paths are untouched.
