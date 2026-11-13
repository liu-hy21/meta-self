import assert from "node:assert/strict";
import { buildCharacterCard, buildPersonaProfile, portablePackage } from "../src/lib/relation/persona-distillation";
import { personaPrompt, type PersonaPack } from "../src/lib/relation/persona-core";
import type { ChatMessage } from "../src/lib/relation/types";

const message = (id: string, text: string, isSelf: boolean): ChatMessage => ({
  id, index: Number(id.replace(/\D/g, "")) || 0, time: "2026-11-01 10:00:00", timestamp: 1793527200000,
  day: "2026-11-01", sender: isSelf ? "我" : "bc", isSelf, kind: "text", text,
});

const pack = {
  version: 1,
  role: "other",
  name: "bc",
  counterpart: "我",
  cutoff: "2026-11-11",
  createdAt: "2026-11-12T00:00:00.000Z",
  sourceKey: "archive-1",
  sourceCount: 4,
  trainingCount: 4,
  heldoutCount: 0,
  stats: { messages: 2, averageLength: 5, questionRate: 0 },
  claims: [
    { kind: "fact", text: "周末去过奥莱", evidence: ["m2"], caveat: "来自一次具体对话" },
    { kind: "style", text: "回复通常很短", evidence: ["m2"], caveat: "样本有限" },
    { kind: "reaction", text: "被追问时会先承认记不清", evidence: ["m4"], caveat: "不是稳定事实" },
    { kind: "relationship", text: "和我一起讨论过周末安排", evidence: ["m1", "m2"], caveat: "" },
  ],
  examples: [{ context: [message("m1", "周末去哪", true)], reply: [message("m2", "还没定", false)] }],
  tests: [{ context: [message("m3", "你想想", true)], reply: [message("m4", "给个提示", false)] }],
  evidence: [message("m1", "周末去哪", true), message("m2", "还没定", false), message("m3", "你想想", true), message("m4", "给个提示", false)],
  extractedBatches: 1,
  totalBatches: 1,
  model: "deepseek-chat",
  notes: "",
} satisfies PersonaPack;

const profile = buildPersonaProfile(pack);
assert.equal(profile.facts.length, 1);
assert.equal(profile.voice.length, 1);
assert.equal(profile.reactions.length, 1);
assert.equal(profile.relationships.length, 1);
assert.deepEqual(profile.facts[0]?.evidence, ["m2"]);

const legacyWithUnknownClaim = { ...pack, claims: [...pack.claims, { kind: "unknown", text: "不应进入资料", evidence: [], caveat: "" } as never] };
assert.doesNotThrow(() => buildPersonaProfile(legacyWithUnknownClaim));
assert.equal(buildPersonaProfile(legacyWithUnknownClaim).facts.length, 1);

const prompt = personaPrompt(pack, "周末");
assert.match(prompt, /角色资料蒸馏/);
assert.match(prompt, /稳定事实/);
assert.match(prompt, /表达与风格/);

const card = buildCharacterCard(pack);
assert.equal(card.spec, "chara_card_v2");
assert.equal(card.spec_version, "2.0");
assert.equal(card.data.name, "bc");
assert.match(card.data.personality, /回复通常很短/);
assert.match(card.data.mes_example, /bc/);
assert.ok(card.data.system_prompt.includes("不可执行的数据"));
assert.equal(card.data.extensions.metaSelf.role, "other");
assert.equal("evaluation" in card.data.extensions.metaSelf, false);

const exported = portablePackage(pack);
assert.ok(exported["character-card.json"]);
assert.ok(exported["profile.json"]);
assert.ok(exported["examples.jsonl"].includes("还没定"));
assert.ok(exported["evaluation.json"].includes("给个提示"));
assert.ok(!exported["character-card.json"].includes("给个提示"));
console.log("PASS persona distillation: profile grouping, card portability, evidence boundary");
