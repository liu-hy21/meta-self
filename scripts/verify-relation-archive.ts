import assert from "node:assert/strict";

import { getChatArchiveMeta, loadChatArchive } from "../src/lib/relation/chat-archive";
import { buildRelationMetrics } from "../src/lib/relation/metrics";

const sourceKey = "wxid_en8z2t73paw522";

async function main() {
  const meta = await getChatArchiveMeta(sourceKey);

  assert.equal(meta.displayName, "bc");
  assert.equal(meta.messageCount, 11114);
  assert.equal(meta.periodStart, "2026-07-07");
  assert.equal(meta.periodEnd, "2026-10-30");

  const page = await loadChatArchive(sourceKey, {
    start: "2026-07-01",
    end: "2026-10-31",
    pageSize: 11114,
  });

  assert.equal(page.total, 11114);
  assert.equal(page.messages.length, 11114);
  assert.equal(page.messages[0]?.id, "msg-000001");
  assert.equal(page.messages.at(-1)?.id, "msg-011114");
  assert.ok(page.messages.every((message) => message.time.startsWith("2026-07") || message.time.startsWith("2026-08") || message.time.startsWith("2026-09") || message.time.startsWith("2026-10")));

  const metrics = buildRelationMetrics(page.messages, "Asia/Shanghai");
  assert.equal(metrics.totalMessages, 11114);
  assert.ok(metrics.activeDays > 0);
  assert.equal(metrics.senderTotals.self + metrics.senderTotals.other, 11114 - metrics.systemMessages);
  assert.equal(metrics.sessionGapMinutes, 45);
  assert.equal(metrics.sessions.length > 0, true);
  assert.ok(metrics.sessions.length < metrics.totalMessages);

  console.log(`PASS archive=${meta.messageCount} messages=${metrics.totalMessages} sessions=${metrics.sessions.length}`);
}

main();
