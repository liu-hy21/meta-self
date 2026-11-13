import assert from "node:assert/strict";
import { summarizePersonaSpeakers } from "../src/lib/relation/persona-style";
import type { ChatMessage } from "../src/lib/relation/types";

const message = (id: number, isSelf: boolean, text: string, kind: ChatMessage["kind"] = "text"): ChatMessage => ({
  id: `m-${id}`,
  index: id,
  time: `2026-08-01 10:0${id}:00`,
  timestamp: 1754013600000 + id * 60_000,
  day: "2026-08-01",
  sender: isSelf ? "我" : "bc",
  isSelf,
  kind,
  text,
});

const result = summarizePersonaSpeakers([
  message(1, true, "周末去哪？"),
  message(2, false, "还没定"),
  message(3, true, "那你想去哪？"),
  message(4, false, "不知道"),
  message(5, false, "[动画表情]", "emoji"),
]);

assert.equal(result.self.total, 2);
assert.equal(result.other.total, 3);
assert.equal(result.self.textMessages, 2);
assert.equal(result.other.averageLength, 3);
assert.ok(result.self.labels.includes("提问较多"));
assert.ok(result.other.labels.includes("短句为主"));
assert.match(result.other.detail, /3 条/);
console.log("PASS persona style: sender totals, compact metrics, evidence-based labels");
