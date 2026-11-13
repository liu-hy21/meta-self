import { prisma } from "@/lib/db";

export type LlmReasoningEffort = "auto" | "none" | "low" | "high" | "max";
export type LlmSettingsInput = { apiKey: string; baseUrl: string; model: string; reasoningEffort?: LlmReasoningEffort };
export type LlmStoredSettings = { apiKey: string | null; baseUrl: string | null; model: string | null; reasoningEffort?: string | null };
export type LlmResolvedSettings = { apiKey: string; baseUrl: string; model: string; reasoningEffort: LlmReasoningEffort };

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-flash";

function resolveEffort(value: string | null | undefined): LlmReasoningEffort {
  if (value === "medium") return "high";
  return value === "none" || value === "low" || value === "high" || value === "max" ? value : "auto";
}

function validateDeepSeekUrl(baseUrl: string) {
  let parsed: URL;
  try { parsed = new URL(baseUrl); } catch { throw new Error("DeepSeek Base URL 格式无效。"); }
  if (parsed.origin !== "https://api.deepseek.com" || !["/", "/v1"].includes(parsed.pathname) || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("仅支持 DeepSeek 官方 API 地址：https://api.deepseek.com/v1。");
  }
}

function isDeepSeekSettings(baseUrl: string, model: string) {
  try { validateDeepSeekUrl(baseUrl); } catch { return false; }
  return /^deepseek-[a-z0-9][a-z0-9._-]*$/i.test(model);
}

export function maskLlmApiKey(value: string | null | undefined) {
  const key = value?.trim() ?? "";
  if (key.length < 6) return key ? "••••••••" : "";
  return `${key.slice(0, Math.min(3, key.length - 2))}${"•".repeat(10)}${key.slice(-2)}`;
}

export function normalizeLlmSettings(input: LlmSettingsInput): LlmSettingsInput {
  const apiKey = input.apiKey.trim();
  const baseUrl = input.baseUrl.trim().replace(/\/$/, "");
  const model = input.model.trim();
  if (!apiKey) throw new Error("请填写 LLM API Key。");
  if (!baseUrl) throw new Error("请填写 LLM Base URL。");
  validateDeepSeekUrl(baseUrl);
  if (!model) throw new Error("请填写 LLM 模型名。");
  if (!/^deepseek-[a-z0-9][a-z0-9._-]*$/i.test(model)) throw new Error("只能选择 DeepSeek 模型。");
  const reasoningEffort = input.reasoningEffort ?? "auto";
  if (!["auto", "none", "low", "high", "max"].includes(reasoningEffort)) throw new Error("思考强度无效。");
  return { apiKey, baseUrl, model, ...(input.reasoningEffort == null ? {} : { reasoningEffort }) };
}

export function resolveLlmSettings(stored: LlmStoredSettings, env: LlmStoredSettings): LlmResolvedSettings | null {
  const apiKey = stored.apiKey?.trim() || env.apiKey?.trim() || "";
  if (!apiKey) return null;
  const resolved = {
    apiKey,
    baseUrl: (stored.baseUrl?.trim() || env.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
    model: stored.model?.trim() || env.model?.trim() || DEFAULT_MODEL,
    reasoningEffort: resolveEffort(stored.reasoningEffort || env.reasoningEffort),
  };
  return isDeepSeekSettings(resolved.baseUrl, resolved.model) ? resolved : null;
}

function envSettings(): LlmStoredSettings {
  return { apiKey: process.env.LLM_API_KEY ?? null, baseUrl: process.env.LLM_BASE_URL ?? null, model: process.env.LLM_MODEL ?? null, reasoningEffort: process.env.LLM_REASONING_EFFORT ?? null };
}

function storedSettings(user: { llmApiKey: string | null; llmBaseUrl: string | null; llmModel: string | null; llmReasoningEffort: string | null } | null): LlmStoredSettings {
  return { apiKey: user?.llmApiKey ?? null, baseUrl: user?.llmBaseUrl ?? null, model: user?.llmModel ?? null, reasoningEffort: user?.llmReasoningEffort ?? null };
}

export async function getLlmSettings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true, llmBaseUrl: true, llmModel: true, llmReasoningEffort: true } });
  return resolveLlmSettings(storedSettings(user), envSettings());
}

export async function getLlmSettingsStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true, llmBaseUrl: true, llmModel: true, llmReasoningEffort: true } });
  const stored = storedSettings(user);
  const env = envSettings();
  const resolved = resolveLlmSettings(stored, env);
  return {
    configured: Boolean(resolved),
    apiKeyMasked: maskLlmApiKey(resolved?.apiKey),
    baseUrl: resolved?.baseUrl ?? stored.baseUrl ?? env.baseUrl ?? DEFAULT_BASE_URL,
    model: resolved?.model ?? stored.model ?? env.model ?? DEFAULT_MODEL,
    reasoningEffort: resolved?.reasoningEffort ?? "auto",
    source: stored.apiKey ? "database" as const : env.apiKey ? "environment" as const : "none" as const,
  };
}

export async function saveLlmSettings(userId: string, input: LlmSettingsInput, clearStoredKey = false) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true } });
  const enteredApiKey = input.apiKey.trim();
  const apiKey = enteredApiKey || existing?.llmApiKey?.trim() || process.env.LLM_API_KEY?.trim() || "";
  const normalized = normalizeLlmSettings({ ...input, apiKey });
  if (!clearStoredKey) {
    const models = await listLlmModels(userId, normalized.baseUrl, apiKey);
    if (!models.includes(normalized.model)) throw new Error("所选模型不在 DeepSeek 当前可用列表中，请重新选择。");
  }
  await prisma.user.update({ where: { id: userId }, data: { llmApiKey: clearStoredKey ? null : enteredApiKey || existing?.llmApiKey || null, llmBaseUrl: normalized.baseUrl, llmModel: normalized.model, llmReasoningEffort: normalized.reasoningEffort ?? "auto" } });
}

export async function listLlmModels(userId: string, baseUrl: string, apiKeyInput: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true } });
  const apiKey = apiKeyInput.trim() || existing?.llmApiKey?.trim() || process.env.LLM_API_KEY?.trim() || "";
  if (!apiKey) throw new Error("请先填写 DeepSeek API Key。");
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
  validateDeepSeekUrl(normalizedBaseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${normalizedBaseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`获取模型失败（HTTP ${response.status}）。`);
    const data = await response.json() as { data?: Array<{ id?: unknown }> };
    if (!Array.isArray(data.data)) throw new Error("模型接口未返回可用列表，请手动填写模型名。");
    return [...new Set(data.data.flatMap((item) => typeof item.id === "string" && /^deepseek-[a-z0-9][a-z0-9._-]*$/i.test(item.id) ? [item.id] : []))].sort();
  } finally { clearTimeout(timeout); }
}

export async function requestLlmChat(userId: string, system: string, user: string, options?: { temperature?: number; maxTokens?: number; responseFormat?: object }) {
  const settings = await getLlmSettings(userId);
  if (!settings) throw new Error("请先在左下角设置中配置 DeepSeek 模型。");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: settings.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], ...(settings.reasoningEffort === "auto" ? { temperature: options?.temperature ?? 0.35 } : { reasoning_effort: settings.reasoningEffort }), ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}), ...(options?.responseFormat ? { response_format: options.responseFormat } : {}) }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`模型请求失败（HTTP ${response.status}）。`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("模型没有返回可用内容。");
    return { model: settings.model, content };
  } finally { clearTimeout(timeout); }
}
