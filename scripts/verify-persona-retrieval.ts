import assert from "node:assert/strict";
import { formatPersonaMemory, personaPrompt, retrievePersonaSessions } from "../src/lib/relation/persona-core";
import type { ChatMessage } from "../src/lib/relation/types";

function message(index: number, time: string, isSelf: boolean, text: string): ChatMessage {
  return {
    id: `msg-${index}`,
    index,
    time,
    timestamp: Date.parse(`${time.replace(" ", "T")}+08:00`),
    day: time.slice(0, 10),
    sender: isSelf ? "我" : "bc",
    isSelf,
    kind: "text",
    text,
  };
}

const messages = [
  message(1, "2026-01-02 18:00:00", true, "上周末我们一起去了望京，还吃了烤鱼。"),
  message(2, "2026-01-02 18:04:00", false, "下次可以去看展。"),
  message(3, "2026-01-03 09:00:00", true, "今天工作有点忙。"),
  message(4, "2026-01-03 09:03:00", false, "那你先忙。"),
  message(5, "2026-01-04 20:00:00", true, "晚安，明天见。"),
  message(6, "2026-01-04 20:03:00", false, "晚安。"),
  message(7, "2026-02-01 10:00:00", true, "这条不应该进入截止日期。"),
];

const matched = retrievePersonaSessions(messages, "2026-01-31", "上次我们一起去了哪里");
assert.ok(matched.length > 0);
assert.ok(matched[0].some((item) => item.text.includes("望京")));
assert.ok(!matched.flat().some((item) => item.text.includes("不应该进入截止日期")));

const vague = retrievePersonaSessions(messages, "2026-01-31", "我们经历过什么");
assert.ok(vague.length > 0);
const memory = formatPersonaMemory(vague, "other", "bc", "我");
assert.match(memory, /望京|晚安/);
assert.match(personaPrompt({ version: 1, role: "other", name: "bc", counterpart: "我", cutoff: "2026-01-31", createdAt: "2026-01-01", sourceKey: "test", sourceCount: 0, trainingCount: 0, heldoutCount: 0, stats: { messages: 0, averageLength: 0, questionRate: 0 }, claims: [], examples: [], tests: [], evidence: [], extractedBatches: 0, totalBatches: 0, model: "test", notes: "" }, "上次", memory), /assistant 回复只是之前生成的草稿/);
console.log("PASS persona retrieval: cutoff, lexical match, vague-history fallback, speaker formatting");
