"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { financeCardPadding } from "@/components/finance/finance-ui-tokens";
import type { ExpenseChatMessage } from "@/lib/finance-expense-agent";

export function FinanceLargeExpenseAiCard({ selectedYear }: { selectedYear: number | null }) {
  const [messages, setMessages] = useState<ExpenseChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: pending ? "auto" : "smooth" });
  }, [messages, pending]);

  async function send(question: string) {
    if (pending || !question.trim()) return;
    const next = [...messages.slice(-14), { role: "user" as const, content: question.trim() }];
    setMessages(next);
    setDraft("");
    setError("");
    setSteps([]);
    setPending(true);
    setMessages([...next, { role: "assistant", content: "" }]);
    try {
      const response = await fetch("/api/finance/large-expenses/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year: selectedYear, history: next }) });
      if (!response.ok || !response.body) throw new Error((await response.json().catch(() => ({}))).error ?? "分析失败，请重试。");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      let completed = false;
      const consume = (line: string) => {
        if (!line) return;
        const event = JSON.parse(line) as { type: "delta" | "done" | "error"; text?: string; message?: string; toolSteps?: string[] };
        if (event.type === "delta") {
          content += event.text ?? "";
          setMessages([...next, { role: "assistant", content }]);
        } else if (event.type === "done") {
          completed = true;
          setSteps(event.toolSteps ?? []);
        } else if (event.type === "error") throw new Error(event.message ?? "分析失败，请重试。");
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) consume(line);
      }
      buffer += decoder.decode();
      if (buffer) consume(buffer);
      if (!completed) throw new Error("分析中断，请重试。");
    } catch (cause) {
      setMessages(next);
      setError(cause instanceof Error ? cause.message : "分析失败，请重试。");
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void send(draft); }

  return (
    <section className={`finance-expense-ai-card ${financeCardPadding} flex h-[640px] flex-col overflow-hidden`} aria-labelledby="finance-large-expense-ai-title">
      <div className="finance-expense-ai-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="finance-expense-ai-mark" aria-hidden="true">AI</span>
          <h2 id="finance-large-expense-ai-title" className="min-w-0 text-base font-semibold">历史大额消费 AI 分析</h2>
        </div>
        <button type="button" disabled={pending} onClick={() => void send("根据这段时间的消费，直接告诉我下次哪些继续花、哪些减少或暂停，给出具体的取舍规则和依据。")}
          className="finance-expense-ai-generate inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition disabled:cursor-wait disabled:opacity-50">
          {pending ? "分析中…" : "生成分析"}
        </button>
      </div>

      <div ref={scrollRef} className="finance-expense-ai-log mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" role="log" aria-live="polite" aria-label="历史大额消费分析对话">
        {messages.length === 0 ? (
          <div className="finance-expense-ai-empty flex h-full items-center justify-center text-sm">尚未生成分析</div>
        ) : messages.map((message, index) => (
          <div key={`${index}-${message.role}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`finance-expense-ai-message ${message.role === "user" ? "finance-expense-ai-user-message whitespace-pre-wrap" : "finance-expense-ai-assistant-message finance-expense-markdown"} ${message.role === "assistant" && index === messages.length - 1 && pending ? "finance-expense-ai-streaming" : ""}`}>
              {message.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown> : message.content}
            </div>
          </div>
        ))}
        {pending ? <div className="finance-expense-ai-thinking text-sm" role="status"><span className="finance-expense-ai-thinking-dot" aria-hidden="true" />正在读取消费记录并分析…</div> : null}
        {steps.length > 0 && !pending ? <p className="finance-expense-ai-step text-xs">已读取历史大额消费</p> : null}
        {error ? <p className="finance-expense-ai-error text-sm" role="alert">{error}</p> : null}
      </div>

      <form onSubmit={submit} className="finance-expense-ai-input mt-5 flex shrink-0 items-end gap-2 pt-5">
        <label htmlFor="finance-expense-question" className="sr-only">输入消费分析问题</label>
        <textarea id="finance-expense-question" value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={2000}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(draft); } }}
          placeholder="追问哪笔消费花得值不值…"
          className="min-h-14 min-w-0 flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none" />
        <button type="submit" disabled={pending || !draft.trim()} aria-label="发送问题"
          className="finance-expense-ai-send grid size-10 shrink-0 place-items-center rounded-full transition disabled:opacity-40">
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 16V4m0 0L5.5 8.5M10 4l4.5 4.5" /></svg>
        </button>
      </form>
    </section>
  );
}
