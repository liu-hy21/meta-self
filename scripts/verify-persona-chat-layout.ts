import assert from "node:assert/strict";
import { CHAT_SUGGESTIONS, PERSONA_VIEW_TABS, getMessageSide } from "../src/lib/relation/persona-chat-ui";
import { PERSONA_DATA_RANGE } from "../src/lib/relation/persona-core";

assert.equal(PERSONA_VIEW_TABS[0]?.key, "试聊");
assert.deepEqual(PERSONA_VIEW_TABS.slice(1).map((item) => item.key), ["资料", "评测"]);
assert.equal(getMessageSide("assistant"), "incoming");
assert.equal(getMessageSide("user"), "outgoing");
assert.ok(CHAT_SUGGESTIONS.includes("上次我们说过的"));
assert.deepEqual(PERSONA_DATA_RANGE, { start: "2026-07-01", end: "2026-10-30", label: "2026-07-01—2026-10-30 全量" });
console.log("PASS persona chat layout: chat-first tabs, message sides, suggestions");
