import Link from "next/link";

export type RelationAnalysisView = "ledger" | "quantity" | "time";

const views: { key: RelationAnalysisView; label: string; number: string }[] = [
  { key: "ledger", label: "指标台账", number: "01" },
  { key: "quantity", label: "数量指标", number: "02" },
  { key: "time", label: "时间指标", number: "03" },
];

export function RelationAnalysisTabs({ personId, current }: { personId: string; current: RelationAnalysisView }) {
  return (
    <nav className="relation-analysis-tabs" aria-label="数据分析分区">
      {views.map((view) => (
        <Link key={view.key} href={`/relation/analysis/${personId}?view=${view.key}`} className={current === view.key ? "is-active" : undefined}>
          <span>{view.number}</span>{view.label}
        </Link>
      ))}
    </nav>
  );
}
