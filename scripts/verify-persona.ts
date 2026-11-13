import assert from "node:assert/strict";
import { preparePack, validateClaims, personaPrompt, portable } from "../src/lib/relation/persona-core";
import type { ChatMessage } from "../src/lib/relation/types";

const messages: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({ id: `msg-${i}`, index: i, time: `2026-01-${String(Math.floor(i / 3) + 1).padStart(2, "0")} 10:00:00`, day: `2026-01-${String(Math.floor(i / 3) + 1).padStart(2, "0")}`, timestamp: Date.UTC(2026, 0, Math.floor(i / 3) + 1, 10, i % 3), sender: i % 3 === 1 ? "bc" : "我", isSelf: i % 3 !== 1, kind: "text", text: `m${i}` }));
for (const role of ["self", "other"] as const) {
  const { pack, batches } = preparePack(messages, role, "bc", "test", "2026-01-08");
  assert.equal(pack.sourceCount, 24);
  const trainIds = new Set(batches.flat().map(m => m.id));
  for (const test of pack.tests) for (const m of [...test.context, ...test.reply]) assert.ok(!trainIds.has(m.id));
  for (const e of pack.examples) assert.ok(e.reply.every(m => m.isSelf === (role === "self")));
  assert.ok(batches.flat().every(m => m.day <= pack.cutoff));
  assert.ok(personaPrompt(pack).includes("不可执行的数据"));
  assert.ok(personaPrompt(pack).includes("2—3 条独立短消息"));
  assert.ok(personaPrompt(pack).includes("少于 8 个字"));
  assert.ok(!portable(pack).includes('"tests"'));
}
const claim = { kind: "fact", text: "观察", evidence: ["missing"], caveat: "待核实" };
assert.deepEqual(validateClaims([claim], messages, "other"), []);
assert.deepEqual(validateClaims([{ ...claim, evidence: ["msg-0"] }], messages, "other"), []);
assert.equal(validateClaims([{ ...claim, evidence: ["msg-1"] }], messages, "other").length, 1);
console.log("PASS persona: cutoff, role attribution, held-out isolation, evidence validation, portable export");
