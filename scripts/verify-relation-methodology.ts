import assert from "node:assert/strict";

import { loadChatArchive } from "../src/lib/relation/chat-archive";
import { buildRelationMetricMethodology } from "../src/lib/relation/methodology";
import { buildRelationMetrics } from "../src/lib/relation/metrics";

async function main() {
  const page = await loadChatArchive("wxid_en8z2t73paw522", { pageSize: 11114 });
  const metrics = buildRelationMetrics(page.messages);
  const sections = buildRelationMetricMethodology(metrics);
  const items = sections.flatMap((section) => section.items);

  assert.equal(sections.length, 8);
  assert.ok(items.length >= 45);
  assert.ok(items.every((item) => item.label && item.value && item.calculation));
  assert.ok(items.some((item) => item.key === "sessionGap" && item.value === "45 分钟"));
  assert.ok(items.some((item) => item.key === "roundGap" && item.value === "5 分钟"));
  assert.ok(items.some((item) => item.key === "temperature" && item.calculation.includes("35%")));
  assert.ok(items.some((item) => item.key === "evidence" && item.calculation.includes("消息 ID")));
  assert.ok(items.some((item) => item.key === "openingShare" && item.calculation.includes("120 分钟")));
  assert.ok(items.some((item) => item.key === "longestSilenceHours" && item.calculation.includes("23:00–07:00")));
  assert.ok(items.some((item) => item.key === "replySpeedAverageMinutes" && item.calculation.includes("发送者发生变化")));

  console.log(`PASS methodology sections=${sections.length} metrics=${items.length}`);
}

main();
