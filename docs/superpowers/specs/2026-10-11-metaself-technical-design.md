# MetaSelf 技术设计方案

| 项 | 内容 |
|---|---|
| 版本 | v0.1（第一版 MVP） |
| 日期 | 2026-10-11 |
| 依据 | `docs/product/QA.md` 全部推荐项（Q1–Q15） |
| 技术栈 | Next.js App Router、React、TypeScript、Tailwind CSS、Prisma、**MySQL** |

---

## 1. 目标与边界

### 1.1 产品目标

MetaSelf 是个人 RSI 工作台：把身体、精神、工作、社会关系、财务五类数据结构化沉淀，在**仅使用已录入数据**的前提下，由服务端模型（或模板回退）生成**双周短提醒**与**月报**（现状、引用依据、改进与下一步）。报告为草稿，用户改定稿后落库；模型**不得**自动改写档案类数据。

### 1.2 第一版范围（已确认）

| 域 | MVP 能力 |
|---|---|
| 身体 | 身体档案；可扩展体征指标；睡眠流水；饮食一句话 + 可选饱腹感 |
| 精神 | 情绪 1–5 + 一句话 |
| 工作 | 公司当前快照；技术栈清单（会 / 在学 / 不用了）；表达复盘一条 |
| 社会关系 | 关系人名册（多标签）；互动（日期、一句话、感受 1–5） |
| 财务 | 资产快照（现金、投资、负债、日期）；财商记录（学习 / 决策） |
| 报告 | 应用内双周卡片 + 月报列表；手动「立即生成」；无邮件/推送 |
| 录入 | 各域短表单为主；首页「快速一句」→ 精神或工作流水 |
| 账号 | 单用户为主，从第一天有 `User` 与登录，便于换设备 |

### 1.3 明确不做（v0.1）

- 多用户社交、关系网可视化、聊天导入  
- 医院/券商/银行对接、PDF/OCR 解析  
- 完整收支记账、食物库与营养素计算  
- 浏览器直连大模型、无密钥时的强依赖（必须有模板回退）  
- 教练式打分排名、诊疗/投资建议口吻（文案约束在生成层）

---

## 2. 架构总览

### 2.1 分层

```
┌─────────────────────────────────────────────────────────┐
│  Browser（RSC 为主，client 仅表单/图表/编辑器）              │
├─────────────────────────────────────────────────────────┤
│  app/ 路由 + Layout + Server Components                  │
│  app/actions/*  Server Actions（鉴权 + 校验 + 写库）        │
├─────────────────────────────────────────────────────────┤
│  lib/queries/*     只读查询（Prisma，供 RSC）               │
│  lib/reports/*     聚合上下文 + 调用 LLM / 模板             │
│  lib/auth/*        会话与当前用户                           │
├─────────────────────────────────────────────────────────┤
│  Prisma → MySQL                                          │
└─────────────────────────────────────────────────────────┘
         可选：Cron Route（双周/月报触发）或仅手动 + 打开应用时检查
```

### 2.2 原则（与 create-next-prisma-app 一致）

- 默认 **Server Component**；`'use client'` 仅用于表单、客户端图表、报告正文编辑。  
- **Prisma 仅 server**（RSC、Route Handler、Server Action）。  
- 独立读请求用 `Promise.all`；报告生成中的 DB 读取与 LLM 调用注意避免无谓串行。  
- 禁止重型 barrel `index.ts` 再导出。  
- 设计 token：CSS 变量 + Tailwind theme（纸色底、单一强调色）。

### 2.3 部署假设

- 目标：Vercel / 自建 Node 均可（MySQL 需外置实例或云数据库，应用不内嵌 MySQL）。  
- **MySQL**：`DATABASE_URL`，Prisma `provider = "mysql"`。示例：  
  `mysql://USER:PASSWORD@HOST:3306/metaself`  
- 本地开发：连接信息写在项目根目录 **`.env`**（已加入 `.gitignore`），模板见 **`.env.example`**。库名约定 **`metaself`**（需在服务器上先建库，utf8mb4）。  
- 库字符集：**utf8mb4** / **utf8mb4_unicode_ci**（支持中文与 emoji 备注）。  
- 密钥：`LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`（OpenAI 兼容）。  
- 定时：优先 **Route Handler + Vercel Cron**（`CRON_SECRET`）；本地开发可只靠「打开首页检查 + 手动生成」。

---

## 3. 领域模型与数据设计

### 3.1 三类数据节奏

| 类型 | 含义 | 存储策略 |
|---|---|---|
| 档案 Profile | 少改 | 各域 1:1 或 1:N 快照表，`isCurrent` 标记当前公司快照 |
| 流水 Flow | 常记 | 按子类型分表，便于趋势 SQL |
| 材料 Material | 偶发 | v0.1：`VitalMetric` + `note`/`source`；文件仅存 URL 或文本备注字段，无对象存储依赖 |

### 3.2 通用字段约定

- 所有业务表：`userId` 外键，`createdAt` / `updatedAt`。  
- 流水表：`occurredAt`（用户感知的发生时间，默认当天）。  
- `source`：`MANUAL` | `PASTE`（快速一句、粘贴摘要）。  
- 金额：`Decimal` 或 `Int` 分（推荐 **分** 存整数，展示除以 100）。  
- 时区：库内 **UTC**；展示与用户「今日」判定用 `Asia/Shanghai`（可环境变量 `APP_TIMEZONE`）。

### 3.3 MySQL 与 Prisma 约定

- `datasource` 使用 **mysql**（非 PostgreSQL / SQLite）。  
- **标量 enum 数组**（如 `RelationKind[]`）MySQL 不支持 → 关系人标签用 **关联表** `RelationPersonKind`。  
- 长文本：`Report.contentMarkdown` 使用 `@db.LongText`；可选备注字段用 `@db.Text`。  
- `Json` 字段（`citationsJson`）MySQL 5.7+ 原生 JSON 类型，Prisma 映射为 `Json`。  
- 迁移：`npx prisma migrate dev`；生产 `migrate deploy`。连接池过大时注意 Serverless 场景用连接池 URL（如加 `?connection_limit=5`，按托管方文档配置）。

### 3.4 Prisma 模型（v0.1）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Domain {
  BODY
  MIND
  WORK
  RELATIONS
  FINANCE
}

enum DataSource {
  MANUAL
  PASTE
}

enum TechStackStatus {
  PROFICIENT
  LEARNING
  DEPRECATED
}

enum RelationKind {
  FRIEND
  ROMANCE
  FAMILY
  OTHER
}

enum FinanceLiteracyKind {
  LEARNING
  DECISION
}

enum ReportType {
  BIWEEKLY
  MONTHLY
}

enum ReportStatus {
  DRAFT
  FINALIZED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  displayName  String?
  timezone     String   @default("Asia/Shanghai")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  bodyProfile       BodyProfile?
  vitalMetrics      VitalMetric[]
  sleepLogs         SleepLog[]
  mealLogs          MealLog[]
  moodLogs          MoodLog[]
  companySnapshots  WorkCompanySnapshot[]
  techStackItems    TechStackItem[]
  expressionReviews ExpressionReview[]
  relationPeople    RelationPerson[]
  relationInteractions RelationInteraction[]
  assetSnapshots    FinanceAssetSnapshot[]
  literacyLogs      FinanceLiteracyLog[]
  reports           Report[]
  reportSchedule    ReportSchedule?
}

model BodyProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  heightCm  Float?
  weightKg  Float?
  birthDate DateTime?
  gender    String?
  bloodType String?
  notes     String?
  updatedAt DateTime @updatedAt
}

model VitalMetric {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String     // 如「收缩压」「血红蛋白」
  value       String     // 展示用字符串，避免单位混乱
  unit        String?
  measuredAt  DateTime
  source      DataSource @default(MANUAL)
  notes       String?
  createdAt   DateTime   @default(now())

  @@index([userId, measuredAt])
}

model SleepLog {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  occurredAt    DateTime   // 以「醒来日」或用户选的睡眠日
  durationHours Float
  note          String?
  source        DataSource @default(MANUAL)
  createdAt     DateTime   @default(now())

  @@index([userId, occurredAt])
}

model MealLog {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  occurredAt  DateTime
  description String
  satiety     Int?       // 1-5 可选
  source      DataSource @default(MANUAL)
  createdAt   DateTime   @default(now())

  @@index([userId, occurredAt])
}

model MoodLog {
  id           String     @id @default(cuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  calendarDate DateTime   @db.Date // 用户时区「日」，写入前归一化
  occurredAt   DateTime?  // 可选具体时刻
  score        Int        // 1-5
  note         String?    @db.Text
  source       DataSource @default(MANUAL)
  createdAt    DateTime   @default(now())

  @@unique([userId, calendarDate])
  @@index([userId, calendarDate])
}

model WorkCompanySnapshot {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyName String
  role        String?
  note        String?
  effectiveAt DateTime @default(now())
  isCurrent   Boolean  @default(true)

  @@index([userId, isCurrent])
}

model TechStackItem {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  status    TechStackStatus
  note      String?
  updatedAt DateTime         @updatedAt

  @@unique([userId, name])
}

model ExpressionReview {
  id              String     @id @default(cuid())
  userId          String
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  occurredAt      DateTime
  context         String     // 场合
  outcome         String?
  nextImprovement String?
  source          DataSource @default(MANUAL)
  createdAt       DateTime   @default(now())

  @@index([userId, occurredAt])
}

model RelationPerson {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  note         String?  @db.Text
  createdAt    DateTime @default(now())
  kinds        RelationPersonKind[]
  interactions RelationInteraction[]
}

model RelationPersonKind {
  personId String
  person   RelationPerson @relation(fields: [personId], references: [id], onDelete: Cascade)
  kind     RelationKind

  @@id([personId, kind])
}

model RelationInteraction {
  id           String     @id @default(cuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  personId     String
  person       RelationPerson @relation(fields: [personId], references: [id], onDelete: Cascade)
  occurredAt   DateTime
  note         String
  feelingScore Int        // 1-5
  source       DataSource @default(MANUAL)
  createdAt    DateTime   @default(now())

  @@index([userId, occurredAt])
}

model FinanceAssetSnapshot {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  asOfDate        DateTime
  cashCents       Int      @default(0)
  investmentCents Int      @default(0)
  liabilityCents  Int      @default(0)
  note            String?
  createdAt       DateTime @default(now())

  @@index([userId, asOfDate])
}

model FinanceLiteracyLog {
  id          String              @id @default(cuid())
  userId      String
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  occurredAt  DateTime
  kind        FinanceLiteracyKind
  content     String
  outcomeNote String?             // 结果未知可空
  source      DataSource          @default(MANUAL)
  createdAt   DateTime            @default(now())

  @@index([userId, occurredAt])
}

model Report {
  id              String       @id @default(cuid())
  userId          String
  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            ReportType
  periodStart     DateTime
  periodEnd       DateTime
  status          ReportStatus @default(DRAFT)
  title           String
  contentMarkdown String       @db.LongText // 生成稿 + 用户编辑后全文
  citationsJson   Json         // 引用的 record id 列表与摘要
  generatedBy     String       // "llm" | "template"
  createdAt       DateTime     @default(now())
  finalizedAt     DateTime?

  @@index([userId, type, periodStart])
}

model ReportSchedule {
  userId              String   @id
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lastBiweeklyAt      DateTime?
  lastMonthlyAt       DateTime?
  nextBiweeklyDue     DateTime?
  nextMonthlyDue      DateTime?
}
```

**实现备注**

- `RelationPersonKind`：MySQL 下固定用关联表表达多标签（友 / 爱 / 亲 / 其他可并存）。  
- `MoodLog`：按 `calendarDate` upsert，避免 `DateTime` 唯一约束与日切不一致。  
- `WorkCompanySnapshot`：新建 `isCurrent=true` 时，同事务内将旧条 `isCurrent=false`。

### 3.5 扩展位（仅 schema 预留或 v0.2）

- `Attachment`（`userId`, `domain`, `storageKey`, `mime`, `linkedRecordType`, `linkedRecordId`）  
- `OrganMetric` / 检查单模板：可继续用 `VitalMetric.name` 约定命名空间，如 `lab.hgb`

---

## 4. 认证与授权

### 4.1 方案

- **Auth.js（NextAuth v5）** 或等价：**Credentials** 登录（email + password）。  
- 第一版可 **种子用户**：部署时 `SEED_EMAIL` / `SEED_PASSWORD` 写入一条 `User`（bcrypt）。  
- 不开放注册 UI；后续可加「邀请码注册」仍保持单租户产品形态。  
- 每个 Server Action / 报告 API：**先 `auth()`，无会话则 `unauthorized`**（与 Vercel 规则 3.1 一致）。

### 4.2 会话

- HTTP-only cookie；生产 `secure`。  
- RSC 通过 `lib/auth/session.ts` 取 `userId`，查询层禁止接受客户端传入的 `userId`。

---

## 5. 路由与页面

| 路径 | 类型 | 职责 |
|---|---|---|
| `/login` | 静态 + client 表单 | 登录 |
| `/` | RSC | 今日五面状态、双周卡片、月报入口、快速一句 |
| `/body` | RSC + client 表单块 | 档案、体征、睡眠、饮食列表与录入 |
| `/mind` | RSC + client | 情绪列表与录入 |
| `/work` | RSC + client | 公司快照、技术栈、表达复盘 |
| `/relations` | RSC + client | 人名册、互动 |
| `/finance` | RSC + client | 资产快照、财商记录 |
| `/reports` | RSC | 报告列表（筛选双周/月报） |
| `/reports/[id]` | RSC + client 编辑器 | 阅读、编辑 Markdown、定稿 |
| `/api/cron/reports` | Route Handler | Cron 触发报告（校验 `CRON_SECRET`） |

### 5.1 布局

- `app/(app)/layout.tsx`：左侧五域导航 + 顶栏（用户、手动生成报告）。  
- `app/(auth)/login`：无侧栏。  
- 移动端：侧栏折叠为底部或抽屉，保证流水录入触控 ≥ 44px。

### 5.2 「今日」聚合逻辑（`lib/queries/today.ts`）

对用户时区「今天」：

| 面 | 「已记」条件 | 「未记」展示 |
|---|---|---|
| 身体 | 存在 `SleepLog` **或**（产品规则 Q3：睡眠+情绪为软目标，身体侧仅提示睡眠） | 未记睡眠 |
| 精神 | 存在当日 `MoodLog` | 未记情绪 |
| 工作 | 7 日内有 `ExpressionReview` 或技术栈更新（可选弱提示） | 可选弱提示 |
| 关系 | 30 日内有互动 | 久未互动 |
| 财务 | 30 日内有 `FinanceAssetSnapshot` | 资产快照过期 |

首页卡片展示：**状态点 + 一行摘要 + 跳转录入**。

### 5.3 趋势（各域详情页一条）

| 域 | 序列 | 展示 |
|---|---|---|
| 身体 | `SleepLog.durationHours` 14 日；`BodyProfile.weightKg` 若有 | 折线（client 轻量图表，动态 import） |
| 精神 | `MoodLog.score` 14 日 | 折线 |
| 财务 | 快照 `cash+investment-liability` | 阶梯线 |

---

## 6. 录入与 Server Actions

### 6.1 校验

- **Zod** schema 与 Action 同文件或 `lib/validations/*`。  
- 分数 1–5、饱腹感可选、金额非负整数分。

### 6.2 Action 清单（命名示例）

| Action | 说明 |
|---|---|
| `upsertBodyProfile` | 档案 |
| `createVitalMetric` | 体征 |
| `createSleepLog` / `createMealLog` | 身体流水 |
| `upsertMoodLog` | 按 `calendarDate` upsert |
| `setCurrentCompanySnapshot` | 公司快照切换 |
| `upsertTechStackItem` | 技术栈 |
| `createExpressionReview` | 表达复盘 |
| `createRelationPerson` / `createRelationInteraction` | 关系 |
| `createAssetSnapshot` / `createLiteracyLog` | 财务 |
| `createQuickNote` | 首页：选 `MIND` → `MoodLog`（仅 note + 默认分 3 可改）或 `WORK` → `ExpressionReview` 最小字段 |
| `updateReportContent` / `finalizeReport` | 报告编辑 |
| `generateReport` | 手动生成（type + 周期） |

### 6.3 快速一句（Q10-C）

- UI：单行输入 + 域选择（精神 / 工作）。  
- 精神：打开小浮层补 **分数** 后提交 upsert 当日 `MoodLog`。  
- 工作：补 **场合** 后创建 `ExpressionReview`（`outcome` 可空）。

---

## 7. 报告流水线

### 7.1 周期定义

- **双周**：`periodEnd = now`，`periodStart = now - 14d`。  
- **月报**：自然月或滚动 30 ·天（推荐 **自然月**，`periodStart` 为月初 0 点用户时区）。  
- `ReportSchedule` 记录上次生成时间与下次 due；首页若 `now >= nextBiweeklyDue` 显示卡片。

### 7.2 上下文构建 `buildReportContext(userId, periodStart, periodEnd)`

并行查询各表 `occurredAt/asOfDate` 在区间内记录，输出结构化 JSON：

```ts
type ReportContext = {
  meta: { periodStart: string; periodEnd: string; timezone: string };
  body: { profile; vitals; sleep; meals };
  mind: { moods };
  work: { company; techStack; expressions };
  relations: { people; interactions };
  finance: { snapshots; literacy };
  gaps: { domain; reason }; // 断记、缺睡眠/情绪天数
  trends: { sleepAvg; moodAvg; netWorthDelta };
};
```

`gaps` / `trends` 在服务端用 SQL 或 Prisma 聚合计算，**不交给模型瞎算**。

### 7.3 生成

1. `context = buildReportContext(...)`  
2. 若配置 `LLM_API_KEY`：调用 OpenAI 兼容 `chat/completions`，system 约束语气（Q12-A）、免责声明（身体/财务）、必须引用 `citations` 中的 id。  
3. 否则：`renderTemplateReport(context)` → Markdown 汇编。  
4. 写入 `Report`：`status=DRAFT`，`citationsJson` 存引用列表。  
5. 更新 `ReportSchedule`。

### 7.4 Prompt 约束（摘要）

- 输出 Markdown；五域各：**现状**、**依据（列表引用 id）**、**改进**、**下一步一条**。  
- 双周：更短，强调断记与一个最小动作。  
- 禁止：投资建议、诊断结论、打分排名。

### 7.5 用户定稿

- `finalizeReport`：`status=FINALIZED`，`finalizedAt=now`；定稿后只读，可复制新版本再生成。

### 7.6 Cron

```
GET /api/cron/reports?types=biweekly,monthly
Authorization: Bearer ${CRON_SECRET}
```

- 遍历用户（v0.1 仅 1 个也可循环）。  
- 若 due 则调用与 `generateReport` 相同核心逻辑。  
- 使用 `after()` 记录日志，不阻塞响应（可选）。

---

## 8. AI 集成

| 环境变量 | 说明 |
|---|---|
| `LLM_API_KEY` | 可选；无则模板 |
| `LLM_BASE_URL` | 默认 OpenAI |
| `LLM_MODEL` | 如 `gpt-4o-mini` |

- 实现：`lib/llm/client.ts` 封装 fetch，超时 60s，失败回退模板。  
- **不向客户端暴露 key**；报告生成仅在 Server Action / Cron 中调用。

---

## 9. 目录结构（脚手架后）

```
src/
  app/
    (auth)/login/
    (app)/
      layout.tsx
      page.tsx                 # 今日
      body/ mind/ work/ relations/ finance/
      reports/ [id]/
    actions/
    api/cron/reports/route.ts
  components/
    layout/app-sidebar.tsx
    today/domain-status-row.tsx
    forms/...
    reports/markdown-editor.tsx  # client
  lib/
    db.ts
    auth/
    queries/
    reports/
    llm/
    validations/
prisma/schema.prisma
```

---

## 10. 安全与隐私

- 全站 HTTPS；密码 bcrypt；速率限制登录（可选 middleware）。  
- 敏感字段（财务、关系）不出现在客户端日志。  
- LLM 请求只发送 `ReportContext` 必要摘要，可配置 `LLM_SEND_RAW_NOTES=true/false`（默认 true，因是个人单租户）。  
- 数据库备份责任在部署方；文档提醒勿提交 `.env`。

---

## 11. 测试与验收

| 场景 | 验收 |
|---|---|
| 登录 | 未登录不能写库 |
| 今日 | 五面状态与未记一致 |
| 睡眠+情绪 | 当日 upsert 情绪不重复两条 |
| 快速一句 | 写入正确子表 |
| 无 LLM | 模板报告可生成且含五域标题 |
| 有 LLM | 草稿含 citationsJson |
| 定稿 | FINALIZED 不可被 Action 覆盖（需新报告） |
| 双周卡片 | due 时出现，生成后消失或更新 due |

---

## 12. 实施顺序建议

1. `create-next-app` + Prisma（**mysql**）migrate + Auth + 种子用户  
2. 身体/精神流水 + 今日页（只读聚合）  
3. 工作/关系/财务 + 各域表单  
4. `buildReportContext` + 模板报告 + `/reports`  
5. LLM 生成 + Cron + 双周卡片  
6. 趋势图、UI 打磨、Web Interface Guidelines 过一遍  

---

## 13. 与 QA 决策对照

| 题 | 决策 |
|---|---|
| Q1 | A 五面 MVP |
| Q2 | B 登录 + User |
| Q3 | B 软目标：睡眠 + 情绪 |
| Q4 | A 饮食一句话 |
| Q5 | B 可扩展体征 |
| Q6 | A 情绪分 + 一句 |
| Q7 | A 公司 + 技术栈 + 表达 |
| Q8 | A 人 + 互动 |
| Q9 | A 快照 + 财商记录 |
| Q10 | C 表单 + 快速一句 |
| Q11 | A 应用内 |
| Q12 | A 备忘语气 |
| Q13 | A 浅色工作台 |
| Q14 | A 首页今日 |
| Q15 | A 服务端 LLM + 模板回退 |

---

## 14. 待你拍板的小点（不阻塞开工）

1. 月报周期：**自然月** vs **滚动 30 天**（上文推荐自然月）。  
2. UI 组件库：是否引入 **shadcn/ui**（父 skill 允许用户点名；未点名则先用 Tailwind 原生组件）。

**已确定**：数据库 **MySQL**；关系人标签 **关联表** `RelationPersonKind`。

---

*本文档为技术设计 v0.1.1（MySQL）；实现前若你调整 QA 决策，应同步修订本节与 schema。*
