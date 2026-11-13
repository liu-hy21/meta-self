import assert from "node:assert/strict";
import { maskLlmApiKey, normalizeLlmSettings, resolveLlmSettings } from "../src/lib/llm-config";

assert.equal(maskLlmApiKey("sk-1234567890"), "sk-••••••••••90");
assert.equal(maskLlmApiKey("abc"), "••••••••");
assert.deepEqual(normalizeLlmSettings({ apiKey: " sk-test ", baseUrl: " https://example.com/v1/ ", model: " model-x " }), {
  apiKey: "sk-test", baseUrl: "https://example.com/v1", model: "model-x",
});
assert.throws(() => normalizeLlmSettings({ apiKey: "", baseUrl: "javascript:alert(1)", model: "" }), /API Key/);
assert.deepEqual(resolveLlmSettings({ apiKey: "stored", baseUrl: "https://stored.test", model: "stored-model" }, {
  apiKey: "env", baseUrl: "https://env.test", model: "env-model",
}), { apiKey: "stored", baseUrl: "https://stored.test", model: "stored-model" });
assert.deepEqual(resolveLlmSettings({ apiKey: null, baseUrl: null, model: null }, {
  apiKey: "env", baseUrl: "https://env.test/", model: "env-model",
}), { apiKey: "env", baseUrl: "https://env.test", model: "env-model" });
console.log("PASS llm settings validation, masking, and env fallback");
