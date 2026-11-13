"use server";

import { getAppUser } from "@/lib/user";
import { getLlmSettingsStatus, listLlmModels, saveLlmSettings, type LlmReasoningEffort } from "@/lib/llm-config";

export async function listLlmModelsAction(baseUrl: string, apiKey: string) {
  const user = await getAppUser();
  return listLlmModels(user.id, baseUrl, apiKey);
}

export async function getLlmSettingsAction() {
  const user = await getAppUser();
  return getLlmSettingsStatus(user.id);
}

export async function saveLlmSettingsAction(formData: FormData) {
  const user = await getAppUser();
  const input = {
    apiKey: String(formData.get("apiKey") ?? ""),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    model: String(formData.get("model") ?? ""),
    reasoningEffort: String(formData.get("reasoningEffort") ?? "auto") as LlmReasoningEffort,
  };
  const clearStoredKey = String(formData.get("clearStoredKey") ?? "") === "true";

  try {
    await saveLlmSettings(user.id, input, clearStoredKey);
    return {
      ok: true,
      message: "LLM 配置已保存。",
      status: await getLlmSettingsStatus(user.id),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存失败，请稍后重试。",
      status: await getLlmSettingsStatus(user.id),
    };
  }
}
