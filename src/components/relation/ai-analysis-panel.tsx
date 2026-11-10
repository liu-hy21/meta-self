"use client";

import Link from "next/link";
import { useActionState } from "react";

import { generateRelationAiReportAction, type RelationAiActionState } from "@/app/actions/data";
import { chatPageFromMessageId } from "@/lib/relation/chat-pagination";

type ReportView = { contentMarkdown: string; model: string; createdAt: string; evidenceCount: number } | null;
type TopicLead = { word: string; count: number; evidenceIds: string[] };

const initialState: RelationAiActionState = { ok: true, message: "" };

function evidenceHref(personId: string, id: string) {
  return `/relation/chat/${personId}?page=${chatPageFromMessageId(id)}#${id}`;
}

function TopicEvidenceLinks({ personId, ids }: { personId: string; ids: string[] }) {
  if (!ids.length) return <span className="relation-evidence-empty">暂无原文证据</span>;
  return <span className="relation-evidence-links">{ids.slice(0, 3).map((id) => <Link key={id} href={evidenceHref(personId, id)}>原文 {id.replace("msg-", "#")}</Link>)}</span>;
}

function TopicLeads({ personId, topics }: { personId: string; topics: TopicLead[] }) {
  if (!topics.length) return null;
  return <section className="relation-shell relation-ai-topics"><div className="relation-section-heading"><div><h2>主题线索</h2><p>基于文字词频生成，供 AI 分析参考</p></div><span>{topics.length} 个词项</span></div><div className="relation-topic-list">{topics.map((topic) => <div key={topic.word}><span>{topic.word}</span><b>{topic.count} 次</b><TopicEvidenceLinks personId={personId} ids={topic.evidenceIds} /></div>)}</div></section>;
}

export function AiAnalysisPanel({ personId, report, topics }: { personId: string; report: ReportView; topics: TopicLead[] }) {
  const [state, formAction, pending] = useActionState(generateRelationAiReportAction, initialState);
  return (
    <div className="relation-ai-layout">
      <TopicLeads personId={personId} topics={topics} />
      <section className="relation-shell relation-ai-control">
        <div>
          <h3>生成一份新的关系观察</h3>
          <p>服务端会发送统计指标与有限原文样本，保留消息 ID 作为证据索引，不会把完整聊天记录交给模型。</p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="personId" value={personId} />
          <button type="submit" className="relation-action relation-action--dark" disabled={pending}>{pending ? "生成中…" : "生成 AI 分析 →"}</button>
        </form>
        {state.message ? <p className={state.ok ? "relation-ai-message" : "relation-ai-message is-error"}>{state.message}</p> : null}
      </section>
      <section className="relation-shell relation-ai-report">
        <div className="relation-section-heading">
          <div><h2>最近一次 AI 分析</h2></div>
          {report ? <span>{new Date(report.createdAt).toLocaleString("zh-CN")} · {report.model}</span> : null}
        </div>
        {report ? <><div className="relation-ai-markdown">{report.contentMarkdown}</div><p className="relation-ai-footnote">关联证据 {report.evidenceCount} 条消息 ID · 以上是模型基于样本的观察，不是人格诊断或关系事实。</p></> : <div className="relation-empty relation-empty--large">还没有生成报告。点击上方按钮开始。</div>}
      </section>
    </div>
  );
}
