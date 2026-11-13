"use client";

import { useState } from "react";

import { getLlmSettingsAction, saveLlmSettingsAction } from "@/app/actions/llm-settings";

type LlmSettingsStatus = {
  configured: boolean;
  apiKeyMasked: string;
  baseUrl: string;
  model: string;
  source: "database" | "environment" | "none";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [model, setModel] = useState("gpt-4o-mini");

  async function openSettings() {
    setOpen(true);
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const next = await getLlmSettingsAction();
      setStatus(next);
      setBaseUrl(next.baseUrl);
      setModel(next.model);
    } catch {
      setError("读取配置失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);
    formData.set("baseUrl", baseUrl);
    formData.set("model", model);
    try {
      const result = await saveLlmSettingsAction(formData);
      if (!result.ok) {
        setError(result.message);
        setStatus(result.status);
        return;
      }
      setStatus(result.status);
      setMessage(result.message);
      const keyInput = event.currentTarget.elements.namedItem("apiKey");
      if (keyInput instanceof HTMLInputElement) keyInput.value = "";
    } catch {
      setError("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function clearStoredKey() {
    setSaving(true);
    setMessage("");
    setError("");
    const formData = new FormData();
    formData.set("baseUrl", baseUrl);
    formData.set("model", model);
    formData.set("clearStoredKey", "true");
    try {
      const result = await saveLlmSettingsAction(formData);
      setStatus(result.status);
      if (result.ok) setMessage("已移除本地保存的 API Key。" );
      else setError(result.message);
    } catch {
      setError("移除失败，请稍后重试。");
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
                  <input name="apiKey" type="password" autoComplete="new-password" placeholder={status?.configured ? "留空则保持当前 Key" : "sk-…"} />
                </label>
                <label>
                  Base URL
                  <input name="baseUrl" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.openai.com/v1" />
                </label>
                <label>
                  Model
                  <input name="model" value={model} onChange={(event) => setModel(event.target.value)} placeholder="gpt-4o-mini" />
                </label>

                {message ? <p className="llm-settings-message" role="status">{message}</p> : null}
                {error ? <p className="llm-settings-error" role="alert">{error}</p> : null}

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
