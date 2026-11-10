import Link from "next/link";
import { notFound } from "next/navigation";

import { AiAnalysisPanel } from "@/components/relation/ai-analysis-panel";
import { RelationWorkbenchNav } from "@/components/relation/relation-workbench-nav";
import { getLatestRelationAiReport } from "@/lib/relation/ai-analysis";
import { getRelationPerson } from "@/lib/relation/people";
import { getAppUser } from "@/lib/user";

export default async function RelationAiAnalysisPage({ params }: { params: Promise<{ personId: string }> }) {
  const user = await getAppUser();
  const { personId } = await params;
  const person = await getRelationPerson(user.id, personId);
  if (!person) notFound();
  const report = await getLatestRelationAiReport(user.id, person.id);
  const metrics = person.archive?.metrics ?? null;

  if (!person.archive) {
    return <div className="relation-workbench"><RelationWorkbenchNav personId={person.id} personName={person.name} /><div className="relation-empty relation-empty--large">这个人物还没有连接聊天档案。</div></div>;
  }
  if (!metrics) {
    return (
      <div className="relation-workbench">
        <RelationWorkbenchNav personId={person.id} personName={person.name} />
        <section className="relation-shell relation-analysis-pending">
          <span className="relation-analysis-status">待分析</span>
          <h3>请先完成数据分析</h3>
          <p>AI 分析会读取已保存的数据快照和有限原文样本。请先在人物管理中点击“计算分析”。</p>
          <Link href="/relation/profile" className="relation-action relation-action--dark">去人物管理</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="relation-workbench">
      <RelationWorkbenchNav personId={person.id} personName={person.name} />
      <section className="relation-shell relation-ai-baseline"><div><h3>先看可计算的温度基线</h3></div><div className="relation-ai-baseline-row">{metrics.temperatureTrend.map((point) => <span key={point.label}><b>{point.score.toFixed(1)}</b><small>{point.label.slice(5)}</small></span>)}</div><p>这条走势只由消息量、双方互惠、活跃日和回应节奏计算；AI 会在此基础上补充解释、双方沟通画像和主题脉络。</p></section>
      <AiAnalysisPanel personId={person.id} topics={metrics.topics} report={report ? { contentMarkdown: report.contentMarkdown, model: report.model, createdAt: report.createdAt.toISOString(), evidenceCount: Array.isArray(report.evidenceJson) ? report.evidenceJson.length : ((report.evidenceJson as { messageIds?: unknown[] } | null)?.messageIds?.length ?? 0) } : null} />
    </div>
  );
}
