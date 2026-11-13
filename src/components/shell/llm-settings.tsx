"use client";

import { useState } from "react";

import { getLlmSettingsAction, listLlmModelsAction, saveLlmSettingsAction } from "@/app/actions/llm-settings";
import type { LlmReasoningEffort } from "@/lib/llm-config";

type LlmSettingsStatus = {
  configured: boolean;
  apiKeyMasked: string;
  baseUrl: string;
  model: string;
  reasoningEffort: LlmReasoningEffort;
  source: "database" | "environment" | "none";
};

type LlmSettingsNotice = {
  kind: "success" | "error";
  text: string;
};

function GearIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="m6.55 2.1.35-.6h2.2l.35.6.2.8.75.45.8-.15.65-.25 1.1 1.1-.25.65-.15.8.45.75.8.2.6.35v2.2l-.6.35-.8.2-.45.75.15.8.25.65-1.1 1.1-.65-.25-.8-.15-.75.45-.2.8-.35.6H6.9l-.35-.6-.2-.8-.75-.45-.8.15-.65.25-1.1-1.1.25-.65.15-.8-.45-.75-.8-.2-.6-.35v-2.2l.6-.35.8-.2.45-.75-.15-.8-.25-.65 1.1-1.1.65.25.8.15.75-.45.2-.8Z" />
      <circle cx="8" cy="8" r="2.2" />
    </svg>
  );
}

export function LlmSettings() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<LlmSettingsStatus | null>(null);
  const [notice, setNotice] = useState<LlmSettingsNotice | null>(null);
  const [baseUrl, setBaseUrl] = useState("https://api.deepseek.com/v1");
  const [model, setModel] = useState("deepseek-flash");
  const [reasoningEffort, setReasoningEffort] = useState<LlmReasoningEffort>("auto");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [apiKey, setApiKey] = useState("");

  async function refreshModels(url = baseUrl, key = apiKey) {
    setLoadingModels(true);
    try {
      setModelOptions(await listLlmModelsAction(url, key));
      setNotice(null);
    } catch (cause) {
      setModelOptions([]);
      setNotice({
        kind: "error",
        text: cause instanceof Error ? cause.message : "获取模型失败，请手动填写模型名。",
      });
    } finally { setLoadingModels(false); }
  }

  async function openSettings() {
    setOpen(true);
    setLoading(true);
    setNotice(null);
    try {
      const next = await getLlmSettingsAction();
      setStatus(next);
      setBaseUrl(next.baseUrl);
      setModel(next.model);
      setReasoningEffort(next.reasoningEffort);
      setModelOptions([]);
      if (next.configured) void refreshModels(next.baseUrl, "");
    } catch {
      setNotice({ kind: "error", text: "读取配置失败，请稍后重试。" });
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const formData = new FormData(event.currentTarget);
    formData.set("baseUrl", baseUrl);
    formData.set("model", model);
    formData.set("reasoningEffort", reasoningEffort);
    try {
      const result = await saveLlmSettingsAction(formData);
      if (!result.ok) {
        setStatus(result.status);
        setNotice({ kind: "error", text: result.message });
        return;
      }
      setStatus(result.status);
      setNotice({ kind: "success", text: result.message });
      setApiKey("");
    } catch {
      setNotice({ kind: "error", text: "保存失败，请稍后重试。" });
    } finally {
      setSaving(false);
    }
  }

  async function clearStoredKey() {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const formData = new FormData();
    formData.set("baseUrl", baseUrl);
    formData.set("model", model);
    formData.set("reasoningEffort", reasoningEffort);
    formData.set("clearStoredKey", "true");
    try {
      const result = await saveLlmSettingsAction(formData);
      setStatus(result.status);
      setNotice(result.ok
        ? { kind: "success", text: "已移除本地保存的 API Key。" }
        : { kind: "error", text: result.message });
    } catch {
      setNotice({ kind: "error", text: "移除失败，请稍后重试。" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rail-settings-slot">
        <button type="button" className={`rail-settings-trigger ${status?.configured ? "is-ready" : ""}`} onClick={openSettings}>
          <GearIcon />
          <span>设置</span>
          <span className="rail-settings-state" aria-label={status?.configured ? "已配置模型" : "尚未配置模型"} />
        </button>
      </div>

      {open ? (
        <div className="llm-settings-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section className="llm-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="llm-settings-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="llm-settings-header">
              <div>
                <p className="llm-settings-kicker">MetaSelf / SYSTEM</p>
                <h2 id="llm-settings-title">LLM 设置</h2>
              </div>
              <button type="button" className="llm-settings-close" aria-label="关闭设置" onClick={() => setOpen(false)}>×</button>
            </header>

            {loading ? <p className="llm-settings-notice">正在读取配置…</p> : (
              <form className="llm-settings-form" onSubmit={submit}>
                <div className={`llm-settings-status ${status?.configured ? "is-ready" : "is-empty"}`}>
                  <span className="llm-settings-status-dot" />
                  <span>{status?.configured ? `已连接 · ${status.apiKeyMasked}` : "未配置 API Key"}</span>
                  {status?.source === "environment" ? <small>环境变量</small> : null}
                </div>

                <label>
                  API Key
                  <input name="apiKey" type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={status?.configured ? "留空则保持当前 Key" : "sk-…"} />
                </label>
                <label>
                  DeepSeek API 地址
                  <input name="baseUrl" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.deepseek.com/v1" />
                </label>
                <div className="llm-settings-model-heading"><span>模型选择</span><button type="button" disabled={loadingModels} onClick={() => void refreshModels()}>{loadingModels ? "获取中…" : "获取模型列表"}</button></div>
                {modelOptions.length > 0 ? (
                  <label>
                    可用模型
                    <select value={modelOptions.includes(model) ? model : ""} onChange={(event) => { if (event.target.value) setModel(event.target.value); }}>
                      <option value="">手动填写</option>
                      {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ) : null}
                <label>
                  当前模型（仅 DeepSeek）
                  <input name="model" value={model} onChange={(event) => setModel(event.target.value)} placeholder="deepseek-flash" />
                </label>
                {modelOptions.length > 0 && !modelOptions.includes(model) ? <p className="llm-settings-error">当前模型已不在可用列表中，请选择上方模型。</p> : null}
                <label>
                  思考强度
                  <select name="reasoningEffort" value={reasoningEffort} onChange={(event) => setReasoningEffort(event.target.value as LlmReasoningEffort)}>
                    <option value="auto">自动（不发送强度参数）</option>
                    <option value="none">关闭</option>
                    <option value="low">低</option>
                    <option value="high">高</option>
                    <option value="max">最高</option>
                  </select>
                </label>

                {notice ? (
                  <p className={notice.kind === "success" ? "llm-settings-message" : "llm-settings-error"} role={notice.kind === "success" ? "status" : "alert"}>
                    {notice.text}
                  </p>
                ) : null}

                <footer className="llm-settings-actions">
                  {status?.source === "database" ? <button type="button" className="llm-settings-clear" onClick={clearStoredKey} disabled={saving}>移除本地 Key</button> : <span />}
                  <span className="llm-settings-actions-right">
                    <button type="button" className="llm-settings-secondary" onClick={() => setOpen(false)}>取消</button>
                    <button type="submit" className="llm-settings-primary" disabled={saving}>{saving ? "保存中…" : "保存配置"}</button>
                  </span>
                </footer>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
