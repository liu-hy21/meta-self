"use client";

import { useState } from "react";

import { FinanceAssetAllocationPie } from "@/components/finance/finance-asset-allocation-pie";
import { FinanceSensitiveAmount } from "@/components/finance/finance-visibility";
import type { FinanceAssetMetricRule, FinanceAssetMetrics } from "@/lib/finance-asset-metrics";
import type { AssetAllocationKey } from "@/lib/finance-holdings";

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

function formatRatio(value: number | null) {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function metricAmount(cnyMinor: number) {
  return <FinanceSensitiveAmount>¥{(cnyMinor / 100).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</FinanceSensitiveAmount>;
}

function RuleRow({
  rule,
  selected,
  onSelect,
}: {
  rule: FinanceAssetMetricRule;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
          selected ? "bg-[var(--ink)]/[0.06]" : "hover:bg-[var(--ink)]/[0.035]"
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-[var(--ink)]">{rule.label}</span>
          <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{metricAmount(rule.currentCnyMinor)}</span>
        </span>
        <span className="shrink-0 text-right tabular-nums">
          <span className={`block text-sm ${rule.status === "over" ? "text-[#b42318]" : "text-[var(--ink)]"}`}>{formatRatio(rule.ratioPct)}</span>
          <span className="block text-[11px] text-[var(--muted)]">上限 {rule.limitPct}%</span>
        </span>
        <StatusMark status={rule.status === "over" ? "over" : "ok"} />
      </button>
    </li>
  );
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
  const firstIssue = metrics.rules.find((rule) => rule.status === "over") ?? metrics.rules[0] ?? null;
  const [selectedLayer, setSelectedLayer] = useState<AssetAllocationKey | null>(firstIssue?.layerKey ?? null);
  const layerRules = selectedLayer ? metrics.rules.filter((rule) => rule.layerKey === selectedLayer) : metrics.rules;
  const sliceStates = metrics.layerStatus;
  const selectedLabel = selectedLayer ? metrics.slices.find((slice) => slice.key === selectedLayer)?.label ?? "上限检查" : "全部上限";

  return (
    <section className="space-y-5" aria-labelledby="finance-metrics-title">
      <div className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrow}>PORTFOLIO METRICS</p>
            <h2 id="finance-metrics-title" className="mt-2 text-xl font-semibold text-[var(--ink)]">资产结构指标</h2>
          </div>
          <StatusMark status={metrics.overLimitCount > 0 ? "over" : "ok"} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
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

      {metrics.overLimitCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border border-[#b42318]/20 bg-[#b42318]/[0.06] px-4 py-3 text-sm text-[#8f241d]" role="alert">
          <StatusMark status="over" />
          <span>问题资产</span>
          <span className="tabular-nums">{metrics.rules.filter((rule) => rule.status === "over").map((rule) => rule.label).join("、")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 border border-[#1f7a4d]/20 bg-[#1f7a4d]/[0.06] px-4 py-3 text-sm text-[#1f7a4d]" role="status">
          <StatusMark status="ok" />
          <span>未发现超限资产</span>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className={`${card} p-5 sm:p-6`} aria-labelledby="finance-allocation-title">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={eyebrow}>ALLOCATION</p>
              <h3 id="finance-allocation-title" className="mt-2 text-base font-semibold text-[var(--ink)]">总资产结构</h3>
            </div>
            <span className="text-xs text-[var(--muted)]">点击图例查看</span>
          </div>
          <div className="mt-5">
            <FinanceAssetAllocationPie
              slices={metrics.slices}
              sliceStates={sliceStates}
              showStatus
              activeKey={selectedLayer}
              onActiveChange={setSelectedLayer}
            />
          </div>
        </section>

        <section className={`${card} p-5 sm:p-6`} aria-labelledby="finance-limit-title">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={eyebrow}>LIMIT CHECK</p>
              <h3 id="finance-limit-title" className="mt-2 text-base font-semibold text-[var(--ink)]">{selectedLabel}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLayer(null)}
              className="min-h-11 px-2 text-xs text-[var(--gold-deep)] underline-offset-4 hover:underline"
            >
              全部
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">占策略基数 A</p>
          <ul className="mt-4 divide-y divide-[var(--ink)]/[0.08]">
            {selectedLayer === "cash" ? (
              <li className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2">
                <span className="min-w-0 flex-1 text-sm text-[var(--ink)]">安全层</span>
                <span className="text-xs text-[var(--muted)]">绝对上限 不设</span>
                <span className="text-xs text-[var(--muted)]">不限</span>
              </li>
            ) : (
              layerRules.map((rule) => (
                <RuleRow
                  key={rule.key}
                  rule={rule}
                  selected={selectedLayer === rule.layerKey}
                  onSelect={() => setSelectedLayer(rule.layerKey)}
                />
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}
