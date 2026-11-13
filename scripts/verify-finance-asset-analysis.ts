import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const tabsSource = await readFile("src/components/finance/finance-analysis-tabs.tsx", "utf8");

  assert.match(tabsSource, /export type FinanceAnalysisView\s*=\s*"signals"\s*\|\s*"metrics"\s*\|\s*"ai"/);
  assert.match(tabsSource, /市场信号分析/);
  assert.match(tabsSource, /资产结构指标/);
  assert.match(tabsSource, /AI 分析/);
  assert.match(tabsSource, /\/finance\/analysis\?view=\$\{view\.key\}/);
  assert.match(tabsSource, /aria-current/);
  assert.match(tabsSource, /FinanceAnalysisTabs/);

  console.log("PASS finance asset analysis tabs");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
