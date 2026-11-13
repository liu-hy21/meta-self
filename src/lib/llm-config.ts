import { prisma } from "@/lib/db";

export type LlmSettingsInput = { apiKey: string; baseUrl: string; model: string };
export type LlmStoredSettings = { apiKey: string | null; baseUrl: string | null; model: string | null };
export type LlmResolvedSettings = { apiKey: string; baseUrl: string; model: string };

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

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
  let parsed: URL;
  try { parsed = new URL(baseUrl); } catch { throw new Error("LLM Base URL 格式无效。"); }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("LLM Base URL 只支持 http 或 https。");
  if (!model) throw new Error("请填写 LLM 模型名。");
  return { apiKey, baseUrl, model };
}

export function resolveLlmSettings(stored: LlmStoredSettings, env: LlmStoredSettings): LlmResolvedSettings | null {
  const apiKey = stored.apiKey?.trim() || env.apiKey?.trim() || "";
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (stored.baseUrl?.trim() || env.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
    model: stored.model?.trim() || env.model?.trim() || DEFAULT_MODEL,
  };
}

function envSettings(): LlmStoredSettings {
  return { apiKey: process.env.LLM_API_KEY ?? null, baseUrl: process.env.LLM_BASE_URL ?? null, model: process.env.LLM_MODEL ?? null };
}

function storedSettings(user: { llmApiKey: string | null; llmBaseUrl: string | null; llmModel: string | null } | null): LlmStoredSettings {
  return { apiKey: user?.llmApiKey ?? null, baseUrl: user?.llmBaseUrl ?? null, model: user?.llmModel ?? null };
}

export async function getLlmSettings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true, llmBaseUrl: true, llmModel: true } });
  return resolveLlmSettings(storedSettings(user), envSettings());
}

export async function getLlmSettingsStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true, llmBaseUrl: true, llmModel: true } });
  const stored = storedSettings(user);
  const env = envSettings();
  const resolved = resolveLlmSettings(stored, env);
  return {
    configured: Boolean(resolved),
    apiKeyMasked: maskLlmApiKey(resolved?.apiKey),
    baseUrl: resolved?.baseUrl ?? stored.baseUrl ?? env.baseUrl ?? DEFAULT_BASE_URL,
    model: resolved?.model ?? stored.model ?? env.model ?? DEFAULT_MODEL,
    source: stored.apiKey ? "database" as const : env.apiKey ? "environment" as const : "none" as const,
  };
}

export async function saveLlmSettings(userId: string, input: LlmSettingsInput, clearStoredKey = false) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { llmApiKey: true } });
  const enteredApiKey = input.apiKey.trim();
  const apiKey = enteredApiKey || existing?.llmApiKey?.trim() || process.env.LLM_API_KEY?.trim() || "";
  const normalized = normalizeLlmSettings({ ...input, apiKey });
  await prisma.user.update({ where: { id: userId }, data: { llmApiKey: clearStoredKey ? null : enteredApiKey || existing?.llmApiKey || null, llmBaseUrl: normalized.baseUrl, llmModel: normalized.model } });
}

export async function requestLlmChat(userId: string, system: string, user: string, options?: { temperature?: number; maxTokens?: number; responseFormat?: object }) {
  const settings = await getLlmSettings(userId);
  if (!settings) throw new Error("尚未配置 LLM API Key，请先打开左下角设置。");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: settings.model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: options?.temperature ?? 0.35, ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}), ...(options?.responseFormat ? { response_format: options.responseFormat } : {}) }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`模型请求失败（HTTP ${response.status}）。`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("模型没有返回可用内容。");
    return { model: settings.model, content };
  } finally { clearTimeout(timeout); }
}
