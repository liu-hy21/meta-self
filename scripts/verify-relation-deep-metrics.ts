import assert from "node:assert/strict";

import { buildRelationMetrics } from "@/lib/relation/metrics";
import type { ChatMessage } from "@/lib/relation/types";

function message(index: number, time: string, isSelf: boolean, text: string, kind: ChatMessage["kind"] = "text"): ChatMessage {
  return {
    id: `fixture-${index}`,
    index,
    time,
    timestamp: Date.parse(`${time.replace(" ", "T")}+08:00`),
    day: time.slice(0, 10),
    sender: isSelf ? "我" : "bc",
    isSelf,
    kind,
    text,
  };
}

const messages = [
  message(1, "2026-07-01 09:00:00", true, "早上好，我们聊一下计划"),
  message(2, "2026-07-01 09:02:00", true, "我已经看完了"),
  message(3, "2026-07-01 09:10:00", false, "好，我来补充细节"),
  message(4, "2026-07-01 09:12:00", false, "下午可以继续"),
  message(5, "2026-07-01 11:00:00", true, "那下午见"),
  message(6, "2026-07-03 20:00:00", false, "这两天还好吗"),
  message(7, "2026-07-03 20:20:00", true, "还不错，谢谢"),
  message(8, "2026-07-03 20:21:00", true, "图片", "image"),
  message(9, "2026-07-03 20:22:00", false, "收到"),
  message(10, "2026-07-03 20:23:00", false, "[系统消息]", "system"),
  message(11, "2026-07-03 20:24:00", false, "动图", "emoji"),
];

const metrics = buildRelationMetrics(messages);

assert.equal(metrics.version, "2026-11-v2");
assert.equal(metrics.coverage.start, "2026-07-01");
assert.equal(metrics.coverage.end, "2026-07-03");
assert.equal(metrics.coverage.activeDays, 2);
assert.equal(metrics.coverage.nonSystemMessages, 10);
assert.equal(metrics.content.textMessages, 8);
assert.equal(metrics.content.mediaMessages, 2);
assert.equal(metrics.rounds.total, 6);
assert.equal(metrics.rounds.self, 3);
assert.equal(metrics.rounds.other, 3);
assert.equal(metrics.sessions.length, 3);
assert.equal(metrics.sessions[0].roundCount, 2);
assert.equal(metrics.sessions[0].initiator, "self");
assert.equal(metrics.sessions[0].bidirectional, true);
assert.equal(metrics.initiation.self, 2);
assert.equal(metrics.initiation.other, 1);
assert.equal(metrics.initiation.bidirectional, 2);
assert.equal(metrics.response.selfToOtherSampleCount, 2);
assert.equal(metrics.response.otherToSelfSampleCount, 1);
assert.equal(metrics.quantity.self.animatedEmojiDailyAverage, 0);
assert.equal(metrics.quantity.other.animatedEmojiDailyMax, 1);
assert.equal(metrics.quantity.self.imageDailyMax, 1);
assert.equal(metrics.quantity.self.messageDailyAverage, 1.7);
assert.equal(metrics.quantity.self.initiationShare, 50);
assert.equal(metrics.quantity.other.initiationShare, 50);
assert.equal(metrics.time.self.replySpeedAverageMinutes, 64);
assert.equal(metrics.time.other.replySpeedAverageMinutes, 4.5);
assert.equal(metrics.time.other.longestSilenceHours, 41);
assert.equal(metrics.time.self.longestSilenceHours, 1.8);
assert.ok(metrics.weekdayHourlyActivity.some((point) => point.total > 0));
assert.ok(metrics.silence.longestMinutes >= 120);
assert.ok(metrics.dailyTrend.some((point) => point.day === "2026-07-03"));

console.log(`PASS deep-metrics sessions=${metrics.sessions.length} rounds=${metrics.rounds.total} activeDays=${metrics.coverage.activeDays}`);
