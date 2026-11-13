import assert from "node:assert/strict";
import { normalizePersonaMessages, normalizePersonaReply } from "../src/lib/relation/persona-message-shape";
import type { ChatMessage } from "../src/lib/relation/types";

const message = (id: number, isSelf: boolean, text: string): ChatMessage => ({
  id: `msg-${id}`,
  index: id,
  time: `2026-08-01 10:0${id}:00`,
  timestamp: 1754013600000 + id * 60_000,
  day: "2026-08-01",
  sender: isSelf ? "我" : "bc",
  isSelf,
  kind: "text",
  text,
});

const normalized = normalizePersonaMessages([
  message(1, false, "在工位熬着呢  周六还得来"),
  message(2, true, "这是我发的一句较长的话  不要拆"),
]);

assert.deepEqual(normalized.map((item) => item.text), ["在工位熬着呢", "周六还得来", "这是我发的一句较长的话  不要拆"]);
assert.equal(normalized[1]?.sourceId, "msg-1");
assert.equal(normalized[2]?.sourceId, undefined);
assert.ok(normalized.slice(0, 2).every((item) => item.text.length < 8));

assert.deepEqual(normalizePersonaReply("在工位熬着呢\n周六还得来"), ["在工位熬着呢", "周六还得来"]);
assert.ok(normalizePersonaReply("这是一段超过七个字的角色回复").every((item) => item.length < 8));

console.log("PASS persona message shape: split counterpart turns and constrain generated bubbles");
