import assert from "node:assert/strict";
import { maskLlmApiKey, normalizeLlmSettings, resolveLlmSettings } from "../src/lib/llm-config";

assert.equal(maskLlmApiKey("sk-1234567890"), "sk-••••••••••90");
assert.equal(maskLlmApiKey("abc"), "••••••••");
assert.deepEqual(normalizeLlmSettings({ apiKey: " sk-test ", baseUrl: " https://api.deepseek.com/v1/ ", model: " deepseek-flash " }), {
  apiKey: "sk-test", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-flash",
});
assert.throws(() => normalizeLlmSettings({ apiKey: "", baseUrl: "javascript:alert(1)", model: "" }), /API Key/);
assert.throws(() => normalizeLlmSettings({ apiKey: "key", baseUrl: "https://api.openai.com/v1", model: "deepseek-flash" }), /DeepSeek 官方 API/);
assert.throws(() => normalizeLlmSettings({ apiKey: "key", baseUrl: "https://api.deepseek.com/v1", model: "gpt-4o" }), /只能选择 DeepSeek/);
assert.deepEqual(resolveLlmSettings({ apiKey: "stored", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-pro" }, {
  apiKey: "env", baseUrl: "https://api.deepseek.com", model: "deepseek-flash",
}), { apiKey: "stored", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-pro", reasoningEffort: "auto" });
assert.deepEqual(resolveLlmSettings({ apiKey: null, baseUrl: null, model: null }, {
  apiKey: "env", baseUrl: "https://api.deepseek.com/", model: "deepseek-flash",
}), { apiKey: "env", baseUrl: "https://api.deepseek.com", model: "deepseek-flash", reasoningEffort: "auto" });
assert.deepEqual(resolveLlmSettings({ apiKey: "stored", baseUrl: null, model: "deepseek-v4-pro", reasoningEffort: "high" }, { apiKey: null, baseUrl: null, model: null }), {
  apiKey: "stored", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-v4-pro", reasoningEffort: "high",
});
assert.equal(resolveLlmSettings({ apiKey: "key", baseUrl: "https://api.openai.com/v1", model: "gpt-4o" }, { apiKey: null, baseUrl: null, model: null }), null);
assert.throws(() => normalizeLlmSettings({ apiKey: "key", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-flash", reasoningEffort: "invalid" as "high" }), /思考强度/);
console.log("PASS llm settings validation, masking, and env fallback");
