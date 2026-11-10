import type { RelationMetricLedgerEntry } from "@/lib/relation/metric-ledger";
import { MetricLedgerCreate } from "@/components/relation/metric-ledger-create";
import { MetricLedgerRows } from "@/components/relation/metric-ledger-rows";

export function MetricLedger({ personId, entries, targetMetricId }: { personId: string; entries: RelationMetricLedgerEntry[]; targetMetricId?: string }) {
  return (
    <div className="relation-ledger-layout">
      <div className="relation-ledger-toolbar relation-ledger-toolbar--top"><MetricLedgerCreate personId={personId} /><span className="relation-ledger-count">{entries.length} 项指标</span></div>

      <section className="relation-ledger-table-shell">
        <div className="relation-ledger-section-head"><h3>现有指标</h3></div>
        <div className="relation-ledger-table">
          <div className="relation-ledger-table-head"><span>指标名称</span><span>计算口径</span><span>操作</span></div>
          <MetricLedgerRows key={targetMetricId ?? "all"} personId={personId} entries={entries.map(({ id, name, calculation }) => ({ id, name, calculation }))} targetMetricId={targetMetricId} />
        </div>
      </section>
    </div>
  );
}
