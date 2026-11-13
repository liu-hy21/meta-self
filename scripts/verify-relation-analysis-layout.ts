import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const ledgerSource = await readFile("src/components/relation/metric-ledger.tsx", "utf8");
  const dashboardSource = await readFile("src/components/relation/metrics-dashboard.tsx", "utf8");

  assert.match(ledgerSource, /className="relation-analysis-view"/);
  assert.match(ledgerSource, /className="relation-analysis-content-section"/);
  assert.match(ledgerSource, /className="relation-analysis-content-heading(?:\s|")/);
  assert.match(ledgerSource, /className="relation-analysis-content-body"/);
  assert.doesNotMatch(ledgerSource, />文字展示</);
  assert.doesNotMatch(dashboardSource, /title="数量类指标"|title="数量概览"/);

  console.log("PASS relation analysis views share the same content shell and labels stay concise");
}

main();
