# Finance Asset Analysis Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在财商资产结构页增加独立的数据分析工作区，提供市场信号、资产结构纯指标和 AI 分析三个前端占位板块，并用 URL 页签保持当前板块。

**Architecture:** 保留 `/finance/profile` 为资产结构总览，在其资产结构卡片加入指向 `/finance/analysis?view=signals` 的入口。新增服务端分析页解析 `view` 查询参数，使用一个财商页签组件和一个板块内容组件渲染三个静态前端占位；未来真实信号、指标和 AI 接入点通过板块边界替换。复用现有财商视觉、金额隐私 Provider 和 shell 导航。

**Tech Stack:** Next.js App Router 16、React、TypeScript、Tailwind utility classes、现有 `tsx` 校验脚本。

**Spec:** `docs/superpowers/specs/2026-11-13-finance-asset-analysis-design.md`

## Global Constraints

- 本次只实现前端页面、导航、占位内容和状态表达，不实现市场信号计算、指标计算、AI 调用、报告生成或新的数据库存储。
- 不请求外部行情，不判断当前顶部或底部，不展示虚构的实时结论。
- 不增加依赖，不修改数据库 schema，不引入外部数据源。
- 现有资产金额隐私规则继续有效：涉及金额的展示默认隐藏，由眼睛按钮统一切换。
- 不修改已有资产录入、价格拉取、总资产隐藏和资产结构计算逻辑。
- 三个页签通过 `/finance/analysis?view=signals|metrics|ai` 直接访问、刷新和分享；无效值回退到 `signals`。

## Review Focus

- 缺失或无效 `view`：页面必须稳定回退到市场信号页签；由 Task 2 的路由校验覆盖。
- 页签切换后刷新：URL 和当前内容必须一致；由 Task 1 的链接断言和 Task 2 的页面校验覆盖。
- AI 占位误导为真实报告：必须显示待生成状态和三类未来输入来源；由 Task 2 的内容断言覆盖。
- 财商 shell 上下文丢失：分析页在顶部标题和左侧导航中仍属于财商；由 Task 3 的导航断言覆盖。
- 资产结构原有金额隐私和更新入口回归：新增入口不能改变原有 Provider、按钮和金额隐藏实现；由 Task 3 的源代码校验及最终手工验证覆盖。

---

### Task 1: Create the finance analysis tab contract

**Files:**
- Create: `src/components/finance/finance-analysis-tabs.tsx`
- Create: `scripts/verify-finance-asset-analysis.ts`

**Interfaces:**
- Produces `FinanceAnalysisView = "signals" | "metrics" | "ai"`.
- Produces `FinanceAnalysisTabs({ current }: { current: FinanceAnalysisView })`.
- Each tab links to `/finance/analysis?view=<view>` and exposes active state through `aria-current="page"` and a visible active class.

- [ ] **Step 1: Write the failing source contract test**

  Add assertions to `scripts/verify-finance-asset-analysis.ts` that the tabs component exports the exact view union, all three labels, all three query values, and active-link semantics. Also assert the route contract will later use the same three values.

- [ ] **Step 2: Run the test to verify it fails**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts`

  Expected: FAIL because `src/components/finance/finance-analysis-tabs.tsx` does not exist.

- [ ] **Step 3: Implement the tab component**

  Create the server-compatible `FinanceAnalysisTabs` component with a fixed ordered view list: `signals / 市场信号分析`, `metrics / 资产结构指标`, `ai / AI 分析`. Use `next/link`, query-string links, the existing ink/gold/panel variables, and compact responsive classes. Do not add client state.

- [ ] **Step 4: Run the test to verify it passes**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts`

  Expected: PASS for the tab contract; route and shell assertions may remain pending until their tasks are implemented.

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/verify-finance-asset-analysis.ts src/components/finance/finance-analysis-tabs.tsx
  git commit -m "feat(finance): add analysis tab contract"
  ```

### Task 2: Build the independent analysis page and three frontend panels

**Files:**
- Create: `src/app/(main)/finance/analysis/page.tsx`
- Create: `src/components/finance/finance-analysis-view.tsx`
- Modify: `scripts/verify-finance-asset-analysis.ts`

**Interfaces:**
- `FinanceAnalysisPage({ searchParams }: { searchParams: Promise<{ view?: string }> })` parses the view and renders the page.
- `FinanceAnalysisView({ view }: { view: FinanceAnalysisView })` renders exactly one active panel.
- The route defaults to `signals` and accepts only `signals`, `metrics`, or `ai`.

- [ ] **Step 1: Extend the failing source contract test**

  Assert that the route awaits `searchParams`, validates all three values, falls back to `signals`, renders `FinanceAnalysisTabs`, and renders a single `FinanceAnalysisView`. Assert that the panel source contains the three required headings, the AI input source text `真实当前市场信号`, `我的资产结构纯指标`, and `五层资产配比与市场阶段研究`, plus an explicit pending state.

- [ ] **Step 2: Run the test to verify it fails**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts`

  Expected: FAIL because the route and panel component do not exist.

- [ ] **Step 3: Implement the page shell and panels**

  Create the server page under the existing `(main)` route group. Use `pageWrap`, a back link to `/finance/profile`, a concise title/description, `FinanceVisibilityProvider`, and the existing `FinanceVisibilityToggle`. Render the tabs and one active panel. The signal and metric panels must use named placeholder cards with `待接入` or `待计算` states and no numeric market values. The AI panel must show the three future inputs and `AI 报告待生成`; it must not import an AI client, fetch an API, or read the research Markdown at runtime.

- [ ] **Step 4: Run the test and type check**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts` and `npx tsc --noEmit`.

  Expected: both PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/verify-finance-asset-analysis.ts "src/app/(main)/finance/analysis/page.tsx" src/components/finance/finance-analysis-view.tsx
  git commit -m "feat(finance): add analysis workspace panels"
  ```

### Task 3: Add the asset structure entry and preserve finance shell context

**Files:**
- Modify: `src/components/finance/finance-assets-section.tsx`
- Modify: `src/components/shell/top-bar.tsx`
- Modify: `src/components/shell/left-rail.tsx`
- Modify: `scripts/verify-finance-asset-analysis.ts`

**Interfaces:**
- The asset structure card exposes a `Link` to `/finance/analysis?view=signals` labeled `数据分析`.
- `TopBar.titleFor` returns `财商 · 数据分析` for paths starting with `/finance/analysis`.
- The finance item in `LeftRail` is active and the “玩转” group is open for both `/finance/profile` and `/finance/analysis`.

- [ ] **Step 1: Extend the failing source contract test**

  Assert the exact analysis link, the top-bar title branch, the left-rail active/open path handling, and the continued presence of `FinanceVisibilityProvider` and `FinanceVisibilityToggle` in the assets section.

- [ ] **Step 2: Run the test to verify it fails**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts`

  Expected: FAIL on the missing asset link and shell path branches.

- [ ] **Step 3: Implement the entry and shell updates**

  Add the secondary action beside `资产结构` without changing its pie chart, data calculations, or amount masking. Update only path matching/title logic so the new analysis route remains within the existing finance navigation context.

- [ ] **Step 4: Run focused checks**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts`, `npx tsc --noEmit`, and focused ESLint on the changed TypeScript files.

  Expected: all commands PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/verify-finance-asset-analysis.ts src/components/finance/finance-assets-section.tsx src/components/shell/top-bar.tsx src/components/shell/left-rail.tsx
  git commit -m "feat(finance): link asset structure to analysis"
  ```

### Task 4: Verify the complete frontend flow

**Files:**
- Modify: none unless verification finds an implementation defect.

**Interfaces:**
- `/finance/profile` links to `/finance/analysis?view=signals`.
- `/finance/analysis`, `/finance/analysis?view=signals`, `/finance/analysis?view=metrics`, and `/finance/analysis?view=ai` render successfully.

- [ ] **Step 1: Run the full relevant verification**

  Run: `npx tsx scripts/verify-finance-asset-analysis.ts`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.

- [ ] **Step 2: Manually verify the browser flow**

  Open `/finance/profile`, click `数据分析`, switch all three tabs, refresh each tab, try an invalid `view`, and confirm the page falls back to `市场信号分析`. Confirm the analysis page has no fake current numbers and the existing asset page still defaults sensitive amounts to `*****`.

- [ ] **Step 3: Review the final diff and status**

  Run: `git status --short` and `git diff HEAD~3 --stat`.

  Expected: only the planned frontend components, route, shell updates, verification script, and commits are present; unrelated user files remain untouched.

- [ ] **Step 4: Commit any final verification-only fix**

  Only if a defect is found during Task 4, commit it with a focused message; otherwise leave the three task commits intact and report the verification results.
