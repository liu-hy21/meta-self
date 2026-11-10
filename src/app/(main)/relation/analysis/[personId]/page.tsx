import Link from "next/link";
import { notFound } from "next/navigation";

import { RelationAnalysisTabs, type RelationAnalysisView } from "@/components/relation/analysis-tabs";
import { MetricLedger } from "@/components/relation/metric-ledger";
import { MetricMethodologyDialog } from "@/components/relation/metric-methodology-dialog";
import { MetricsDashboard } from "@/components/relation/metrics-dashboard";
import { RelationWorkbenchNav } from "@/components/relation/relation-workbench-nav";
import { listRelationMetricLedger } from "@/lib/relation/metric-ledger";
import { getRelationPerson } from "@/lib/relation/people";
import { getAppUser } from "@/lib/user";

const validViews: RelationAnalysisView[] = ["ledger", "quantity", "time"];

export default async function RelationAnalysisPage({ params, searchParams }: { params: Promise<{ personId: string }>; searchParams: Promise<{ view?: string; metric?: string }> }) {
  const user = await getAppUser();
  const { personId } = await params;
  const { view: requestedView, metric: targetMetricId } = await searchParams;
  const person = await getRelationPerson(user.id, personId);
  if (!person) notFound();
  if (!person.archive) {
    return <div className="relation-workbench"><RelationWorkbenchNav personId={person.id} personName={person.name} /><div className="relation-empty relation-empty--large">这个人物还没有连接聊天档案，暂时无法计算指标。</div></div>;
  }

  const metrics = person.archive.metrics;
  const ledger = await listRelationMetricLedger(user.id, person.id, metrics);
  const view = validViews.includes(requestedView as RelationAnalysisView) ? requestedView as RelationAnalysisView : "quantity";

  return (
    <div className="relation-workbench">
      <RelationWorkbenchNav personId={person.id} personName={person.name} />
      <div className="relation-analysis-status-bar"><div><span className={`relation-analysis-status ${metrics ? "is-done" : ""}`}>{metrics ? "已分析" : "待分析"}</span><span>{metrics ? person.archive.analyzedAt?.toLocaleString("zh-CN") || "已保存" : "指标台账可在分析前维护"}</span></div>{metrics ? <MetricMethodologyDialog metrics={metrics} /> : null}</div>
      <RelationAnalysisTabs personId={person.id} current={view} />
      {view === "ledger" ? <MetricLedger personId={person.id} entries={ledger} targetMetricId={targetMetricId} /> : metrics ? <MetricsDashboard metrics={metrics} personId={person.id} ledger={ledger} view={view} /> : <section className="relation-shell relation-analysis-pending"><h3>还没有生成数据分析</h3><p>请先到人物管理中点击“计算分析”。分析结果会保存到人物档案，之后本页只读取已保存快照。</p><Link href="/relation/profile" className="relation-action relation-action--dark">去人物管理</Link></section>}
    </div>
  );
}
