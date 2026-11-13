import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const tabsSource = await readFile("src/components/finance/finance-analysis-tabs.tsx", "utf8");
  const pageSource = await readFile("src/app/(main)/finance/analysis/page.tsx", "utf8");
  const profileSource = await readFile("src/app/(main)/finance/profile/page.tsx", "utf8");
  const viewSource = await readFile("src/components/finance/finance-analysis-view.tsx", "utf8");
  const metricsSource = await readFile("src/components/finance/finance-asset-metrics-dashboard.tsx", "utf8");
  const metricLogicSource = await readFile("src/lib/finance-asset-metrics.ts", "utf8");
  const assetsSource = await readFile("src/components/finance/finance-assets-section.tsx", "utf8");
  const largeExpensesSource = await readFile("src/components/finance/finance-large-expenses-card.tsx", "utf8");
  const largeExpensesAiCardSource = await readFile("src/components/finance/finance-large-expense-ai-card.tsx", "utf8");
  const largeExpensesAiSource = await readFile("src/lib/finance-expense-agent.ts", "utf8");
  const dropdownSource = await readFile("src/components/finance/finance-dropdown.tsx", "utf8");
  const largeExpensesLibSource = await readFile("src/lib/finance-large-expenses.ts", "utf8");
  const dataActionsSource = await readFile("src/app/actions/data.ts", "utf8");
  const financeSchemaSource = await readFile("prisma/schema.prisma", "utf8");
  const formSource = await readFile("src/components/finance/finance-holdings-form.tsx", "utf8");
  const trendSource = await readFile("src/components/finance/finance-asset-trend-chart.tsx", "utf8");
  const allocationSource = await readFile("src/components/finance/finance-asset-allocation-pie.tsx", "utf8");
  const uiTokensSource = await readFile("src/components/finance/finance-ui-tokens.ts", "utf8");
  const topBarSource = await readFile("src/components/shell/top-bar.tsx", "utf8");
  const leftRailSource = await readFile("src/components/shell/left-rail.tsx", "utf8");
  const agentsSource = await readFile("AGENTS.md", "utf8");

  assert.match(tabsSource, /export type FinanceAnalysisView\s*=\s*"signals"\s*\|\s*"ai"/);
  assert.match(tabsSource, /市场信号分析/);
  assert.doesNotMatch(tabsSource, /资产结构指标/);
  assert.match(tabsSource, /AI 分析/);
  assert.match(tabsSource, /\/finance\/analysis\?view=\$\{view\.key\}/);
  assert.match(tabsSource, /aria-current/);
  assert.match(tabsSource, /FinanceAnalysisTabs/);

  assert.match(pageSource, /searchParams/);
  assert.match(pageSource, /validViews/);
  assert.match(pageSource, /signals/);
  assert.doesNotMatch(pageSource, /buildFinanceAssetMetrics/);
  assert.match(pageSource, /ai/);
  assert.match(pageSource, /FinanceAnalysisTabs/);
  assert.match(pageSource, /FinanceAnalysisView/);
  assert.match(pageSource, /FinanceVisibilityProvider/);
  assert.match(pageSource, /FinanceVisibilityToggle/);

  assert.match(viewSource, /市场信号分析/);
  assert.doesNotMatch(viewSource, /FinanceAssetMetricsDashboard/);
  assert.match(viewSource, /AI 分析/);
  assert.match(viewSource, /真实当前市场信号/);
  assert.match(viewSource, /我的资产结构纯指标/);
  assert.match(viewSource, /五层资产配比与市场阶段研究/);
  assert.match(viewSource, /待接入/);
  assert.match(viewSource, /AI 报告待生成/);
  assert.doesNotMatch(viewSource, /\bfetch\s*\(/);

  assert.match(metricsSource, /<h2 id="finance-metrics-title" className=\{financeModuleTitle\}>指标<\/h2>/);
  assert.doesNotMatch(metricsSource, /五层状态|流动现金|不足|超限/);
  assert.doesNotMatch(metricsSource, /type FinanceAssetMetrics|SummaryCard|StatusMark|metricAmount/);
  assert.doesNotMatch(metricsSource, /FinanceAssetAllocationPie/);
  assert.doesNotMatch(metricsSource, /问题资产/);
  assert.doesNotMatch(metricsSource, /LIMIT CHECK/);
  assert.match(metricLogicSource, /FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR/);
  assert.match(metricLogicSource, /ABSOLUTE_LIMITS/);
  assert.match(metricLogicSource, /overLimitCount/);
  assert.match(assetsSource, /FinanceAssetMetricsDashboard/);
  assert.match(assetsSource, /FinanceLargeExpensesCard/);
  assert.match(assetsSource, /FinanceLargeExpenseAiCard/);
  assert.match(assetsSource, /xl:grid-cols-2/);
  assert.match(assetsSource, /buildFinanceAssetMetrics/);
  assert.match(assetsSource, /<FinanceAssetTrendChart[\s\S]*dark/);
  assert.match(assetsSource, /<div className="grid lg:grid-cols-2">/);
  assert.doesNotMatch(assetsSource, /<section className=\{`\$\{financeCard\} \$\{financeCardPadding\}`\}>\s*<FinanceAssetTrendChart/);

  assert.match(assetsSource, /href="\/finance\/analysis\?view=signals"/);
  assert.match(assetsSource, /数据分析/);
  assert.match(assetsSource, /FinanceVisibilityProvider/);
  assert.match(assetsSource, /FinanceVisibilityToggle/);
  assert.match(topBarSource, /pathname\.startsWith\("\/finance\/analysis"\)/);
  assert.match(topBarSource, /财商 · 数据分析/);
  assert.match(leftRailSource, /pathname\.startsWith\("\/finance\/analysis"\)/);
  assert.match(leftRailSource, /const financeOpen =/);
  assert.match(leftRailSource, /active=\{financeOpen\}/);

  const financeSources = [pageSource, viewSource, metricsSource, assetsSource, formSource, trendSource];
  for (const label of [
    "NET ASSETS · CNY",
    "ALLOCATION",
    "HISTORY",
    "UPDATE SNAPSHOT",
    "TREND",
    "PORTFOLIO METRICS",
    "MARKET SIGNALS",
    "AI RESEARCH NOTE",
    "REPORT INPUTS",
    "REPORT",
    "指数 ETF",
  ]) {
    assert.ok(financeSources.every((source) => !source.includes(label)), `unexpected finance explanatory label: ${label}`);
  }
  assert.match(agentsSource, /财商页面铁律/);
  assert.match(agentsSource, /不使用英文解释性眉题、标签或小字/);
  assert.match(agentsSource, /所有模块标题统一使用/);
  assert.match(agentsSource, /财商下拉框不得使用浏览器默认外观/);
  assert.match(agentsSource, /模块之间保持 `24px` 外间距/);
  assert.match(agentsSource, /卡片统一使用 `24px` 内边距、`16px` 圆角/);
  assert.match(uiTokensSource, /text-base font-semibold text-\[var\(--ink\)\]/);
  assert.match(uiTokensSource, /gap-6/);
  assert.match(uiTokensSource, /p-6/);
  assert.match(uiTokensSource, /rounded-2xl/);
  assert.match(uiTokensSource, /financeDarkSelect/);
  assert.match(uiTokensSource, /appearance-none/);
  assert.match(largeExpensesSource, /<FinanceDropdown/);
  assert.doesNotMatch(largeExpensesSource, /<select/);
  assert.match(dropdownSource, /createPortal/);
  assert.match(dropdownSource, /role="listbox"/);
  for (const source of [viewSource, metricsSource, assetsSource, formSource, trendSource]) {
    assert.match(source, /financeModuleTitle/);
  }
  for (const source of [viewSource, metricsSource, assetsSource, formSource]) {
    assert.match(source, /financeCard/);
  }
  assert.equal((assetsSource.match(/<RegionCard\s+title="海外"/g) ?? []).length, 1);
  assert.equal((assetsSource.match(/<RegionCard\s+title="国内"/g) ?? []).length, 1);
  assert.match(assetsSource, /<FinanceRegionBlocks[\s\S]*<\/section>/);
  assert.match(largeExpensesSource, /历史大额消费/);
  assert.match(largeExpensesSource, /id="finance-large-expenses-card"/);
  assert.match(largeExpensesSource, /createFinanceLargeExpense/);
  assert.match(largeExpensesSource, /updateFinanceLargeExpense/);
  assert.match(largeExpensesSource, /aria-label=\{`编辑\$\{expense\.title\}`\}/);
  assert.match(largeExpensesSource, /按年份筛选历史大额消费/);
  assert.match(largeExpensesSource, /selectedYearTotalMinor/);
  assert.match(largeExpensesSource, /selectedYearTypeTotals/);
  assert.match(largeExpensesSource, /FinanceLargeExpenseTypePie/);
  assert.match(largeExpensesSource, /类型分布/);
  assert.match(largeExpensesSource, /<div className="flex items-center justify-between gap-4 border-b border-\[var\(--panel\)\]\/15 pb-5">/);
  assert.doesNotMatch(largeExpensesSource, /<form id="finance-large-expense-form"[\s\S]*?className="mt-6 border-t/);
  assert.match(largeExpensesAiCardSource, /历史大额消费 AI 分析/);
  assert.match(largeExpensesAiCardSource, /<div className="flex items-center justify-between gap-4 border-b border-\[var\(--panel\)\]\/15 pb-5">/);
  assert.doesNotMatch(largeExpensesAiCardSource, /FinanceDropdown/);
  assert.match(largeExpensesAiCardSource, /chatFinanceLargeExpensesAction/);
  assert.match(largeExpensesAiCardSource, /历史大额消费分析对话/);
  assert.match(largeExpensesAiCardSource, /发送问题/);
  assert.doesNotMatch(largeExpensesAiCardSource, /selectedYear == null \? "全部年份"/);
  assert.doesNotMatch(largeExpensesAiCardSource, /\$\{selectedYear\}年/);
  assert.match(largeExpensesAiCardSource, /生成分析/);
  assert.match(largeExpensesAiSource, /financeLargeExpense\.findMany/);
  assert.match(largeExpensesAiSource, /read_large_expenses/);
  assert.match(largeExpensesAiSource, /tool_choice/);
  assert.match(largeExpensesAiSource, /tool_calls/);
  assert.doesNotMatch(largeExpensesAiSource, /financeHolding|FinanceAssetSnapshot|financeProfile/);
  assert.match(largeExpensesSource, /旅游/);
  assert.match(largeExpensesSource, /医疗/);
  assert.match(largeExpensesSource, /基本日常/);
  assert.match(largeExpensesSource, /name="type"/);
  assert.match(largeExpensesSource, /name="expenseYear"/);
  assert.doesNotMatch(largeExpensesSource, /name="note"/);
  assert.match(largeExpensesSource, /pageCount/);
  assert.doesNotMatch(largeExpensesSource, /export const FINANCE_LARGE_EXPENSES_PAGE_SIZE/);
  assert.match(largeExpensesLibSource, /FINANCE_LARGE_EXPENSES_PAGE_SIZE = 5/);
  assert.match(dataActionsSource, /export async function createFinanceLargeExpense/);
  assert.match(dataActionsSource, /export async function updateFinanceLargeExpense/);
  assert.match(dataActionsSource, /chatFinanceLargeExpensesAction/);
  assert.match(dataActionsSource, /#finance-large-expenses-card/);
  assert.match(dataActionsSource, /FinanceLargeExpenseType/);
  assert.match(dataActionsSource, /typeValue/);
  assert.match(dataActionsSource, /where: \{ id, userId \}/);
  assert.match(financeSchemaSource, /model FinanceLargeExpense/);
  assert.match(financeSchemaSource, /enum FinanceLargeExpenseType/);
  assert.match(financeSchemaSource, /MEDICAL/);
  assert.match(financeSchemaSource, /DAILY/);
  assert.match(profileSource, /orderBy: \[\{ occurredOn: "desc" \}, \{ createdAt: "desc" \}\]/);
  assert.match(profileSource, /expenseYear/);
  assert.match(profileSource, /yearTotals/);
  assert.match(profileSource, /type: true/);
  assert.match(profileSource, /selectedYearTypeTotals/);
  assert.match(assetsSource, /selectedYearTypeTotals/);
  assert.match(allocationSource, /lg:flex-col xl:mx-auto[\s\S]*?xl:flex-row/);

  console.log("PASS finance asset analysis tabs");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
