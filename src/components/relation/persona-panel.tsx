"use client";

import { useState } from "react";
import Link from "next/link";
import { savePersonaNotes, chatPersona, evaluatePersona } from "@/app/actions/persona";
import { PERSONA_DATA_RANGE, type PersonaPack, type Role } from "@/lib/relation/persona-core";
import type { PersonaSpeakerStats, PersonaSpeakerStyle } from "@/lib/relation/persona-style";
import { portablePackage } from "@/lib/relation/persona-distillation";
import { chatPageFromMessageId } from "@/lib/relation/chat-pagination";
import { CHAT_SUGGESTIONS, getMessageSide, PERSONA_VIEW_TABS } from "@/lib/relation/persona-chat-ui";
import "./persona-panel.module.css";

type Saved = { id: string; pack: PersonaPack };
type Turn = { role: "user" | "assistant"; content: string };
export function PersonaPanel({ personId, name, initial, configured, speakerStats }: { personId: string; name: string; initial: Saved[]; configured: boolean; speakerStats: PersonaSpeakerStats }) {
  const [records, setRecords] = useState(initial);
  const [role, setRole] = useState<Role>("other");
  const [selected, setSelected] = useState(initial.find(r => r.pack.role === "other")?.id ?? "");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [tab, setTab] = useState("试聊"), [notes, setNotes] = useState(initial.find(r => r.pack.role === "other")?.pack.notes ?? "");
  const [history, setHistory] = useState<Turn[]>([]), [input, setInput] = useState("");
  const [testIndex, setTestIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<{ a: string; b: string; actual: string; aIsRole: boolean } | null>(null);
  const [reveal, setReveal] = useState(false);
  const current = records.find(r => r.id === selected), pack = current?.pack;
  function select(id: string) { setSelected(id); setNotes(records.find(r => r.id === id)?.pack.notes ?? ""); setHistory([]); setEvaluation(null); setTestIndex(0); }
  function update(saved: Saved) { setRecords(prev => [saved, ...prev.filter(r => r.id !== saved.id)]); setSelected(saved.id); }
  async function run(fn: () => Promise<void>) { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "操作失败，请重试。"); } finally { setBusy(false); } }
  function download(format: "md" | "json") {
    if (!pack) return;
    const files = portablePackage(pack);
    const url = URL.createObjectURL(new Blob([format === "md" ? files["START.md"] : JSON.stringify(files, null, 2)], { type: format === "md" ? "text/markdown;charset=utf-8" : "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `${pack.role}-${pack.cutoff}.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const displayName = pack?.name ?? (role === "self" ? "我" : name);
  const counterpart = pack?.counterpart ?? (role === "self" ? name : "我");
  const submitChat = () => {
    if (!current || !input.trim()) return;
    const next: Turn[] = [...history, { role: "user", content: input.trim() }];
    run(async () => {
      const reply = await chatPersona(current.id, next.slice(-39));
      setHistory([...next, ...reply.map((content) => ({ role: "assistant" as const, content }))]);
      setInput("");
    });
  };

  return <div className="persona-panel">
    <PersonaArchitecture pack={pack} role={role} name={name} configured={configured} tab={tab} hasHistory={history.length > 0} speakerStats={speakerStats} />
    <div className="persona-workspace">
      <div className="persona-toolbar persona-toolbar--setup">
        <div className="persona-role-switcher">{(["other", "self"] as const).map(value => <button key={value} disabled={busy} aria-pressed={role === value} onClick={() => { setRole(value); select(records.find(r => r.pack.role === value)?.id ?? ""); }}>{value === "self" ? "我" : name}</button>)}</div>
        <div className="persona-data-scope"><span>数据范围</span><strong>{PERSONA_DATA_RANGE.label}</strong><small>原始全量</small></div>
      </div>
      {!configured && <p role="status">尚未配置模型。试聊和评测需要先在左下角设置中配置 LLM。</p>}
      {error && <p role="alert" className="persona-error">{error}</p>}
      {pack && current ? <>
        {tab === "试聊" && <section className="persona-chat-shell" aria-label="角色试聊">
          <header className="persona-chat-header">
            <div className="persona-chat-identity">
              <span className="persona-avatar persona-avatar--role">{displayName.slice(0, 2)}</span>
              <div><strong>{displayName}</strong><span>{configured ? "在线 · 角色模拟" : "本地 · 待配置模型"}</span></div>
            </div>
            <div className="persona-chat-header-actions">
              <button className="persona-button--quiet" disabled={busy} onClick={() => download("json")}>导出</button>
            </div>
          </header>
          <div className="persona-chat-context"><span>试聊</span><span>检索 TOP 6</span><span>{PERSONA_DATA_RANGE.label}</span><span>不会写入真人记忆</span></div>
          <div className="persona-chat-messages" aria-live="polite">
            {!history.length ? <div className="persona-chat-empty">
              <div className="persona-chat-empty-avatar">{displayName.slice(0, 2)}</div>
              <h2>开始和 {displayName} 聊天</h2>
              <p>从历史会话中找相似语境，回复只用于试聊。</p>
              <div className="persona-suggestion-grid">{CHAT_SUGGESTIONS.map(suggestion => <button type="button" key={suggestion} onClick={() => setInput(suggestion)}>{suggestion}</button>)}</div>
            </div> : <div className="persona-chat-thread">
              {history.map((m, i) => <article key={`${m.role}-${i}`} className={`persona-chat-message persona-chat-message--${getMessageSide(m.role)}`}>
                <span className="persona-avatar">{(m.role === "assistant" ? displayName : counterpart).slice(0, 2)}</span>
                <div className="persona-chat-message-body"><span className="persona-chat-message-name">{m.role === "assistant" ? displayName : counterpart}</span><p>{m.content}</p></div>
              </article>)}
            </div>}
          </div>
          <form className="persona-chat-composer" onSubmit={e => { e.preventDefault(); submitChat(); }}>
            <div className="persona-chat-input-wrap">
              <textarea aria-label="试聊消息" placeholder={`发消息给 ${displayName}`} maxLength={4000} value={input} onChange={e => setInput(e.target.value)} disabled={busy || !configured} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submitChat(); } }} />
              <div><span>Enter 发送 · Shift+Enter 换行</span><span>{input.length}/4000</span></div>
            </div>
            <div className="persona-chat-composer-actions"><button type="button" className="persona-button--quiet" disabled={busy || !history.length} onClick={() => setHistory([])}>重新开始</button><button type="submit" className="persona-button--send" disabled={busy || !configured || !input.trim()}>发送 <span>↵</span></button></div>
          </form>
        </section>}
        <div className="persona-chat-secondary">
          <nav className="persona-tabs" aria-label="角色模拟分区">{PERSONA_VIEW_TABS.map(item => <button key={item.key} aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>{item.label}</button>)}</nav>
          {tab === "资料" && <>
            <div className="persona-summary"><span>原文 {pack.sourceCount} 条</span><span>样例 {pack.examples.length} 组</span><span>评测 {pack.tests.length} 组</span><span>{pack.model}</span><button className="persona-button--quiet" disabled={busy} onClick={() => download("md")}>导出便携版</button></div>
            <section className="persona-card persona-card--stats"><h2>表达统计</h2><p>文字消息 {pack.stats.messages} 条 · 平均 {pack.stats.averageLength} 字 · 含问号消息 {(pack.stats.questionRate * 100).toFixed(1)}%</p></section>
            <section className="persona-card"><h2>角色资料</h2>{!pack.claims.length && <p>尚无 AI 提取结果；试聊仍会从原始聊天检索相关历史会话。</p>}{pack.claims.map((c, i) => <article key={i}><small>{{ fact: "事实", style: "表达", reaction: "情境反应", relationship: "关系" }[c.kind]}</small><p>{c.text}</p>{c.caveat && <p className="persona-notice">{c.caveat}</p>}<div className="persona-links">{c.evidence.map(id => <Link key={id} href={`/relation/chat/${personId}?page=${chatPageFromMessageId(id)}#${id}`}>{id}</Link>)}</div></article>)}</section>
            <section className="persona-card"><h2>修订与补充</h2><textarea aria-label="修订与补充" value={notes} onChange={e => setNotes(e.target.value)} maxLength={12000} disabled={busy} placeholder="明确指出需要纠正的观察或补充已确认的事实" /><button disabled={busy} onClick={() => run(async () => { await savePersonaNotes(current.id, notes); update({ ...current, pack: { ...pack, notes } }); })}>保存修订</button></section>
            <section className="persona-card"><h2>对话样例 <span>· {pack.examples.length}</span></h2>{pack.examples.map((e, i) => <details key={i}><summary>{e.reply[0].time} · {e.reply[0].text.slice(0, 50)}</summary>{[...e.context, ...e.reply].map(m => { const sourceId = m.sourceId ?? m.id; return <p key={m.id}><b>{m.isSelf ? "我" : name}：</b>{m.text} <Link href={`/relation/chat/${personId}?page=${chatPageFromMessageId(sourceId)}#${sourceId}`}>原文</Link></p>; })}</details>)}</section>
          </>}
          {tab === "评测" && <section className="persona-card"><h2>留出会话盲测</h2><p>只使用目标回复发生前的资料；用户修订不参与历史评测。先判断 A / B 哪个更像，再揭晓来源。</p>{pack.tests.length ? <><select aria-label="测试会话" disabled={busy} value={testIndex} onChange={e => { setTestIndex(Number(e.target.value)); setEvaluation(null); }}>{pack.tests.map((t, i) => <option key={i} value={i}>{i + 1} · {t.reply[0].time}</option>)}</select><div>{pack.tests[testIndex].context.map(m => <p key={m.id}><b>{m.isSelf ? "我" : name}：</b>{m.text}</p>)}</div><button disabled={busy || !configured} onClick={() => run(async () => { const r = await evaluatePersona(current.id, testIndex); const flip = Math.random() > 0.5; setEvaluation({ a: flip ? r.simulated : r.baseline, b: flip ? r.baseline : r.simulated, actual: r.actual, aIsRole: flip }); setReveal(false); })}>生成盲测</button>{evaluation && <><div className="persona-comparison"><article><h3>A</h3><p>{evaluation.a}</p></article><article><h3>B</h3><p>{evaluation.b}</p></article></div><button onClick={() => setReveal(true)}>揭晓来源与原回复</button>{reveal && <p>A：{evaluation.aIsRole ? "角色资料" : "基础提示"}；B：{evaluation.aIsRole ? "基础提示" : "角色资料"}<br />真实回复：{evaluation.actual}</p>}</>}</> : <p>完整会话不足，暂无留出测试样本。</p>}</section>}
        </div>
      </> : <section className="persona-chat-shell persona-chat-shell--empty"><div className="persona-chat-empty"><div className="persona-chat-empty-avatar">{displayName.slice(0, 2)}</div><h2>暂无角色资料</h2><p>请先连接 2026-07-01—2026-10-30 的聊天档案。</p></div></section>}
    </div>
  </div>;
}

type ArchitectureKind = "archive" | "retrieve" | "memory" | "reply";

function ArchitectureGlyph({ kind }: { kind: ArchitectureKind }) {
  if (kind === "archive") return <svg aria-hidden viewBox="0 0 20 20" fill="none"><path d="M4 4.5h12v3H4zM4 9h12v3H4zM4 13.5h12v2H4z" /><path d="M6.5 3v14M13.5 3v14" /></svg>;
  if (kind === "retrieve") return <svg aria-hidden viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="4.5" /><path d="m12 12 4 4M5.5 8.5h6M8.5 5.5v6" /></svg>;
  if (kind === "memory") return <svg aria-hidden viewBox="0 0 20 20" fill="none"><path d="M4 5.5 10 3l6 2.5v8L10 16l-6-2.5zM4 5.5l6 2.5 6-2.5M10 8v8" /></svg>;
  return <svg aria-hidden viewBox="0 0 20 20" fill="none"><path d="M3 10h9M9 6l4 4-4 4" /><path d="M15.5 4.5v2M15.5 13.5v2M14.5 5.5h2M14.5 14.5h2" /></svg>;
}

function SpeakerProfile({ label, stats, maxTotal }: { label: string; stats: PersonaSpeakerStyle; maxTotal: number }) {
  return (
    <article className="persona-speaker-card">
      <div className="persona-speaker-head"><span className="persona-speaker-avatar">{label.slice(0, 2)}</span><strong>{label}</strong><b>{stats.total.toLocaleString("zh-CN")}<small> 条</small></b></div>
      <div className="persona-speaker-track" aria-hidden><i style={{ width: `${Math.max(8, Math.round((stats.total / Math.max(maxTotal, 1)) * 100))}%` }} /></div>
      <div className="persona-speaker-labels">{stats.labels.map((item) => <span key={item}>{item}</span>)}</div>
      <small className="persona-speaker-detail">{stats.detail}</small>
    </article>
  );
}

function PersonaArchitecture({
  pack,
  role,
  name,
  configured,
  tab,
  hasHistory,
  speakerStats,
}: {
  pack?: PersonaPack;
  role: Role;
  name: string;
  configured: boolean;
  tab: string;
  hasHistory: boolean;
  speakerStats: PersonaSpeakerStats;
}) {
  const target = role === "self" ? "我" : name;
  const maxTotal = Math.max(speakerStats.self.total, speakerStats.other.total);
  const normalizedMessageTotal = speakerStats.self.total + speakerStats.other.total;
  const steps: { kind: ArchitectureKind; label: string; value: string; state: "active" | "ready" | "idle" }[] = [
    { kind: "archive", label: "聊天原文", value: pack ? `${normalizedMessageTotal.toLocaleString("zh-CN")} 条` : "待载入", state: pack ? "ready" : "idle" },
    { kind: "retrieve", label: "会话检索", value: tab === "试聊" ? "LIVE" : "TOP 6", state: tab === "试聊" ? "active" : "ready" },
    { kind: "memory", label: "角色资料", value: pack?.claims.length ? `${pack.claims.length} 条观察` : "原文优先", state: pack ? "ready" : "idle" },
    { kind: "reply", label: "模型回复", value: configured ? "已连接" : "待配置", state: configured ? "ready" : "idle" },
  ];

  return (
    <aside className={`persona-architecture ${hasHistory ? "is-chatting" : ""}`} aria-label="角色模拟架构">
      <div className="persona-architecture-head">
        <div className="persona-architecture-brand"><span>M</span><div><strong>角色回路</strong><small>SIM / FLOW</small></div></div>
        <i aria-hidden className="persona-architecture-pulse" />
      </div>
      <div className="persona-architecture-target"><span>当前角色</span><b>{target}</b><em>↔ {role === "self" ? name : "我"}</em></div>
      <div className="persona-speakers-head"><span>真实对话</span><small>7—10月</small></div>
      <div className="persona-speakers-grid">
        <SpeakerProfile label={name} stats={speakerStats.other} maxTotal={maxTotal} />
        <SpeakerProfile label="我" stats={speakerStats.self} maxTotal={maxTotal} />
      </div>
      <div className="persona-architecture-flow">
        {steps.map((step, index) => (
          <div className="persona-architecture-step" key={step.kind}>
            <div className={`persona-architecture-node is-${step.state}`}>
              <span className="persona-architecture-index">0{index + 1}</span>
              <span className="persona-architecture-glyph"><ArchitectureGlyph kind={step.kind} /></span>
              <span className="persona-architecture-copy"><b>{step.label}</b><small>{step.value}</small></span>
              <i aria-hidden />
            </div>
            {index < steps.length - 1 ? <span className={`persona-architecture-link ${step.state === "active" ? "is-active" : ""}`} aria-hidden><i /></span> : null}
          </div>
        ))}
      </div>
      <div className="persona-architecture-foot"><span><i aria-hidden />{hasHistory ? "LIVE" : "READY"}</span><small>{PERSONA_DATA_RANGE.label}</small></div>
    </aside>
  );
}
