import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routeFiles = [
  ["src/app/(main)/relation/profile/page.tsx", "relation-shell--people"],
  ["src/app/(main)/relation/people/[personId]/page.tsx", "relation-attribute-categories"],
  ["src/app/(main)/relation/chat/[personId]/page.tsx", "ChatReader"],
  ["src/app/(main)/relation/analysis/[personId]/page.tsx", "RelationAnalysisTabs"],
  ["src/app/(main)/relation/analysis/[personId]/ai/page.tsx", "AiAnalysisPanel"],
] as const;

async function main() {
  let analysisSource = "";
  for (const [file, marker] of routeFiles) {
    const source = await readFile(file, "utf8");
    assert.match(source, /export default/);
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (file.includes("relation/analysis/[personId]/page.tsx")) analysisSource = source;
  }
  assert.doesNotMatch(analysisSource, /MetricMethodologyDialog|relation-analysis-status-bar/);
  console.log(`PASS routes=${routeFiles.length}`);
}

main();
