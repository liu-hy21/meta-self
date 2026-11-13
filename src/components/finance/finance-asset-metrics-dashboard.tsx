"use client";

import { FinanceSensitiveAmount } from "@/components/finance/finance-visibility";
import type { FinanceAssetMetrics } from "@/lib/finance-asset-metrics";

const card = "border border-[var(--ink)]/10 bg-[var(--panel)] shadow-[0_1px_2px_rgba(28,25,23,0.04)]";
const eyebrow = "text-[10px] tracking-[0.2em] text-[var(--muted)]";

function StatusMark({ status }: { status: "ok" | "over" | "below" }) {
  const isHealthy = status === "ok";
  const label = status === "ok" ? "正常" : status === "over" ? "超限" : "低于下限";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isHealthy ? "text-[#1f7a4d]" : "text-[#b42318]"}`}>
      <span
        className={`grid size-4 place-items-center rounded-full border ${isHealthy ? "border-[#1f7a4d]/35 bg-[#1f7a4d]/10" : "border-[#b42318]/35 bg-[#b42318]/10"}`}
        aria-hidden
      >
        {isHealthy ? (
          <svg viewBox="0 0 16 16" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3.5 8.2 2.8 2.7 6.2-6" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3.2v5.1M8 11.7h.01" />
          </svg>
        )}
      </span>
      {label}
    </span>
  );
}

function metricAmount(cnyMinor: number) {
  return <FinanceSensitiveAmount>¥{(cnyMinor / 100).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</FinanceSensitiveAmount>;
}

function SummaryCard({
  label,
  status,
  value,
  meta,
}: {
  label: string;
  status: "ok" | "over" | "below";
  value: string;
  meta: React.ReactNode;
}) {
  return (
    <article className="border border-[var(--ink)]/10 bg-[var(--panel)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--muted)]">{label}</span>
        <StatusMark status={status} />
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-[var(--ink)]">{value}</p>
      <p className="mt-1 text-xs tabular-nums text-[var(--muted)]">{meta}</p>
    </article>
  );
}

export function FinanceAssetMetricsDashboard({ metrics }: { metrics: FinanceAssetMetrics }) {
  return (
    <section className="space-y-4" aria-labelledby="finance-metrics-title">
      <div className={`${card} p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrow}>PORTFOLIO METRICS</p>
            <h2 id="finance-metrics-title" className="mt-2 text-xl font-semibold text-[var(--ink)]">资产结构指标</h2>
          </div>
          <StatusMark status={metrics.overLimitCount > 0 ? "over" : "ok"} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <SummaryCard
            label="绝对上限"
            status={metrics.overLimitCount > 0 ? "over" : "ok"}
            value={metrics.overLimitCount > 0 ? `${metrics.overLimitCount} 项超限` : "全部正常"}
            meta={`${metrics.checkedLimitCount} 项已检查`}
          />
          <SummaryCard
            label="流动现金"
            status={metrics.cashFloorStatus === "below" ? "below" : "ok"}
            value={metrics.cashFloorStatus === "below" ? "低于下限" : "达到下限"}
            meta={
              <>
                当前 {metricAmount(metrics.liquidCashCnyMinor)} · 下限 {metricAmount(metrics.cashFloorCnyMinor)}
              </>
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--ink)]/[0.08] pt-4 text-xs text-[var(--muted)]">
          <span>策略基数 A {metricAmount(metrics.strategyBaseCnyMinor)}</span>
          <span>总资产 {metricAmount(metrics.totalCnyMinor)}</span>
          {metrics.cashShortfallCnyMinor > 0 ? <span className="text-[#b42318]">缺口 {metricAmount(metrics.cashShortfallCnyMinor)}</span> : null}
        </div>
      </div>
    </section>
  );
}
