import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const tabsSource = await readFile("src/components/finance/finance-analysis-tabs.tsx", "utf8");
  const pageSource = await readFile("src/app/(main)/finance/analysis/page.tsx", "utf8");
  const viewSource = await readFile("src/components/finance/finance-analysis-view.tsx", "utf8");
  const metricsSource = await readFile("src/components/finance/finance-asset-metrics-dashboard.tsx", "utf8");
  const metricLogicSource = await readFile("src/lib/finance-asset-metrics.ts", "utf8");
  const assetsSource = await readFile("src/components/finance/finance-assets-section.tsx", "utf8");
  const topBarSource = await readFile("src/components/shell/top-bar.tsx", "utf8");
  const leftRailSource = await readFile("src/components/shell/left-rail.tsx", "utf8");

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

  assert.match(metricsSource, /绝对上限/);
  assert.match(metricsSource, /流动现金/);
  assert.doesNotMatch(metricsSource, /FinanceAssetAllocationPie/);
  assert.doesNotMatch(metricsSource, /问题资产/);
  assert.doesNotMatch(metricsSource, /LIMIT CHECK/);
  assert.match(metricLogicSource, /FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR/);
  assert.match(metricLogicSource, /ABSOLUTE_LIMITS/);
  assert.match(metricLogicSource, /overLimitCount/);
  assert.match(assetsSource, /FinanceAssetMetricsDashboard/);
  assert.match(assetsSource, /buildFinanceAssetMetrics/);
  assert.match(assetsSource, /xl:grid-cols-2/);

  assert.match(assetsSource, /href="\/finance\/analysis\?view=signals"/);
  assert.match(assetsSource, /数据分析/);
  assert.match(assetsSource, /FinanceVisibilityProvider/);
  assert.match(assetsSource, /FinanceVisibilityToggle/);
  assert.match(topBarSource, /pathname\.startsWith\("\/finance\/analysis"\)/);
  assert.match(topBarSource, /财商 · 数据分析/);
  assert.match(leftRailSource, /pathname\.startsWith\("\/finance\/analysis"\)/);
  assert.match(leftRailSource, /const financeOpen =/);
  assert.match(leftRailSource, /active=\{financeOpen\}/);

  console.log("PASS finance asset analysis tabs");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
