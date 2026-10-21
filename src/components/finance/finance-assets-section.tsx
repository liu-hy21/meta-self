import Link from "next/link";
import type { FinanceHoldingAccount, FinanceHoldingLog } from "@prisma/client";

import { FinanceAssetAllocationPie } from "@/components/finance/finance-asset-allocation-pie";
import { FinanceAssetTrendChart, type AssetTrendPoint } from "@/components/finance/finance-asset-trend-chart";
import { FinanceHoldingsForm } from "@/components/finance/finance-holdings-form";
import {
  accountAllocation,
  computeAllocationCnyMinor,
  computeTotalCnyMinor,
  domesticHoldings,
  financeHoldingConfigs,
  formatNativeAmount,
  HKD_TO_CNY,
  holdingAccountLabel,
  holdingConfig,
  holdingToCnyMinor,
  overseasHoldings,
  schwabHoldingConfigs,
  schwabTotalUsdMinor,
  splitCnyMinor,
  USD_TO_CNY,
  type HoldingConfig,
} from "@/lib/finance-holdings";

type HoldingRow = { account: FinanceHoldingAccount; amountMinor: number };

const card = "rounded-2xl border border-[var(--ink)]/10 bg-[var(--panel)] shadow-[0_1px_2px_rgba(28,25,23,0.04)]";
const eyebrow = "text-[11px] tracking-[0.2em] text-[var(--muted)]";

function Yuan({ minor, className = "" }: { minor: number; className?: string }) {
  const { integer, decimal } = splitCnyMinor(minor);
  return (
    <span className={`tabular-nums ${className}`}>
      ¥{integer}
      <span className="opacity-45">.{decimal}</span>
    </span>
  );
}

function HoldingLine({
  config,
  amountMinor,
  totalCnyMinor,
  label,
  indent = false,
}: {
  config: HoldingConfig;
  amountMinor: number;
  totalCnyMinor: number;
  label?: string;
  indent?: boolean;
}) {
  const cny = holdingToCnyMinor(amountMinor, config);
  const share = totalCnyMinor > 0 ? (cny / totalCnyMinor) * 100 : 0;
  const allocation = accountAllocation(config.account);
  return (
    <li className={`group px-5 py-3.5 transition-colors hover:bg-[var(--ink)]/[0.025] ${indent ? "pl-9" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: allocation.color }} aria-hidden />
            {label ?? config.label}
          </p>
          <p className="mt-0.5 pl-3.5 text-[11px] text-[var(--muted)]">
            {allocation.label === config.label ? "指数 ETF" : allocation.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium tabular-nums text-[var(--ink)]">{formatNativeAmount(amountMinor, config)}</p>
          <p className="mt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
            {config.currency !== "CNY" ? `≈ ¥${splitCnyMinor(cny).integer} · ` : ""}
            {share.toFixed(1)}%
          </p>
        </div>
      </div>
      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--ink)]/[0.05]">
        <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: allocation.color, opacity: 0.75 }} />
      </div>
    </li>
  );
}

function RegionCard({
  title,
  caption,
  subtotalMinor,
  children,
}: {
  title: string;
  caption: string;
  subtotalMinor: number;
  children: React.ReactNode;
}) {
  return (
    <section className={`${card} overflow-hidden`}>
      <header className="flex items-end justify-between gap-3 border-b border-[var(--ink)]/[0.07] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-[var(--ink)]">{title}</h3>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">{caption}</p>
        </div>
        <Yuan minor={subtotalMinor} className="text-base font-semibold text-[var(--ink)]" />
      </header>
      <ul className="divide-y divide-[var(--ink)]/[0.05]">{children}</ul>
    </section>
  );
}

type LogGroup = { key: string; at: Date; totalCnyMinor: number; items: FinanceHoldingLog[] };

function groupLogs(logs: FinanceHoldingLog[]) {
  const groups: LogGroup[] = [];
  for (const log of logs) {
    const minute = Math.floor(log.createdAt.getTime() / 60_000);
    const key = `${minute}-${log.totalCnyMinor}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(log);
    else groups.push({ key, at: log.createdAt, totalCnyMinor: log.totalCnyMinor, items: [log] });
  }
  return groups;
}

function LogEntry({ group, previousTotal }: { group: LogGroup; previousTotal: number | null }) {
  const when = group.at.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const delta = previousTotal == null ? null : group.totalCnyMinor - previousTotal;
  return (
    <li className="group relative pb-6 pl-7 last:pb-0">
      <span className="absolute left-[5px] top-2 bottom-0 w-px bg-[var(--ink)]/10 group-last:hidden" aria-hidden />
      <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-[var(--gold-deep)] bg-[var(--panel)]" aria-hidden />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs tabular-nums text-[var(--muted)]">{when}</p>
        <p className="text-sm">
          <Yuan minor={group.totalCnyMinor} className="font-medium text-[var(--ink)]" />
          {delta != null && delta !== 0 ? (
            <span className={`ml-2 text-xs tabular-nums ${delta > 0 ? "text-[#4d7a66]" : "text-[#b3644d]"}`}>
              {delta > 0 ? "+" : "-"}¥{splitCnyMinor(Math.abs(delta)).integer}
            </span>
          ) : null}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {group.items.map((log) => {
          const config = holdingConfig(log.account);
          return (
            <span
              key={log.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)]/[0.045] px-2.5 py-1 text-[11px] tabular-nums text-[var(--ink)]"
            >
              <span className="text-[var(--muted)]">{holdingAccountLabel(log.account)}</span>
              {log.previousAmountMinor == null ? "" : `${formatNativeAmount(log.previousAmountMinor, config)} → `}
              {formatNativeAmount(log.newAmountMinor, config)}
            </span>
          );
        })}
      </div>
    </li>
  );
}

function ChangeLog({ logs }: { logs: FinanceHoldingLog[] }) {
  const groups = groupLogs(logs);
  const shown = groups.slice(0, 5);
  const rest = groups.slice(5);
  const prevTotal = (index: number) => groups[index + 1]?.totalCnyMinor ?? null;

  return (
    <section className={`${card} p-6`}>
      <div className="flex items-end justify-between">
        <div>
          <p className={eyebrow}>HISTORY</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--ink)]">变更记录</h3>
        </div>
        <span className="text-xs text-[var(--muted)]">共 {groups.length} 次保存</span>
      </div>
      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">还没有修改记录。</p>
      ) : (
        <>
          <ol className="mt-6">
            {shown.map((g, i) => (
              <LogEntry key={g.key} group={g} previousTotal={prevTotal(i)} />
            ))}
          </ol>
          {rest.length > 0 ? (
            <details className="group/more mt-6">
              <summary className="cursor-pointer list-none text-sm text-[var(--gold-deep)] hover:underline">
                <span className="group-open/more:hidden">查看更早的 {rest.length} 次记录</span>
                <span className="hidden group-open/more:inline">收起</span>
              </summary>
              <ol className="mt-6">
                {rest.map((g, i) => (
                  <LogEntry key={g.key} group={g} previousTotal={prevTotal(i + 5)} />
                ))}
              </ol>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}

export function FinanceAssetsSection({
  holdings,
  logs,
  trendPoints,
  editing,
  assetsError,
}: {
  holdings: HoldingRow[];
  logs: FinanceHoldingLog[];
  trendPoints: AssetTrendPoint[];
  editing: boolean;
  assetsError?: "required" | "invalid";
}) {
  const amounts = new Map<FinanceHoldingAccount, number>(financeHoldingConfigs.map((c) => [c.account, 0]));
  for (const h of holdings) amounts.set(h.account, h.amountMinor);

  if (editing) {
    return (
      <div className="space-y-6">
        <div>
          <p className={eyebrow}>UPDATE SNAPSHOT</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">更新资产</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">按当前实际余额填写全部账户，保存后生成今日快照。</p>
        </div>
        <FinanceHoldingsForm initial={Object.fromEntries(amounts)} error={assetsError} />
      </div>
    );
  }

  const totalCnyMinor = computeTotalCnyMinor(amounts);
  const slices = computeAllocationCnyMinor(amounts);
  const sum = (configs: HoldingConfig[]) =>
    configs.reduce((s, c) => s + holdingToCnyMinor(amounts.get(c.account) ?? 0, c), 0);
  const overseasCny = sum([...schwabHoldingConfigs, ...overseasHoldings]);
  const domesticCny = sum(domesticHoldings);
  const schwabUsd = schwabTotalUsdMinor(amounts);

  const sortedPoints = [...trendPoints].sort((a, b) => a.date.localeCompare(b.date));
  const previous = sortedPoints.length >= 2 ? sortedPoints[sortedPoints.length - 2] : null;
  const latest = sortedPoints[sortedPoints.length - 1] ?? null;
  const delta = previous ? totalCnyMinor - previous.totalCnyMinor : null;
  const deltaPct = previous && previous.totalCnyMinor > 0 && delta != null ? (delta / previous.totalCnyMinor) * 100 : null;
  const { integer, decimal } = splitCnyMinor(totalCnyMinor);

  return (
    <div className="space-y-6">
      <section className={`${card} grid overflow-hidden xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,1fr)]`}>
        <div className="flex flex-col justify-between gap-8 bg-[var(--ink)] p-7 text-[var(--panel)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.25em] opacity-60">NET ASSETS · CNY</p>
              <p className="mt-1 text-sm opacity-80">总资产</p>
            </div>
            <Link
              href="/finance/profile?edit=1"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--panel)] px-4 text-sm font-medium text-[var(--ink)] transition-transform hover:-translate-y-px"
            >
              更新资产
            </Link>
          </div>

          <div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              ¥{integer}
              <span className="text-2xl opacity-40 sm:text-3xl">.{decimal}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {delta != null && previous ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${
                    delta >= 0 ? "bg-[#9fc7b3]/15 text-[#9fc7b3]" : "bg-[#e3a593]/15 text-[#e3a593]"
                  }`}
                >
                  {delta >= 0 ? "▲" : "▼"} ¥{splitCnyMinor(Math.abs(delta)).integer}
                  {deltaPct != null ? ` · ${Math.abs(deltaPct).toFixed(2)}%` : ""}
                </span>
              ) : null}
              <span className="opacity-50">
                {previous ? `较 ${previous.date.slice(5, 10).replace("-", "/")} 快照` : "暂无对比快照"}
                {latest ? ` · 最近更新 ${latest.date.slice(0, 10)}` : ""}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
            <div>
              <dt className="text-xs opacity-50">海外</dt>
              <dd className="mt-1 text-lg font-medium tabular-nums">¥{splitCnyMinor(overseasCny).integer}</dd>
            </div>
            <div>
              <dt className="text-xs opacity-50">国内</dt>
              <dd className="mt-1 text-lg font-medium tabular-nums">¥{splitCnyMinor(domesticCny).integer}</dd>
            </div>
          </dl>
        </div>

        <div className="p-7 sm:p-8">
          <p className={eyebrow}>ALLOCATION</p>
          <h3 className="mb-6 mt-1 text-base font-semibold text-[var(--ink)]">资产结构</h3>
          <FinanceAssetAllocationPie slices={slices} />
        </div>
      </section>

      <section className={`${card} p-6 sm:p-7`}>
        <FinanceAssetTrendChart points={trendPoints} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <RegionCard title="海外" caption={`美元 × ${USD_TO_CNY} · 港币 × ${HKD_TO_CNY}`} subtotalMinor={overseasCny}>
          <li className="flex items-center justify-between bg-[var(--ink)]/[0.02] px-5 py-3">
            <span className="text-xs font-semibold tracking-[0.2em] text-[var(--ink)]">SCHWAB</span>
            <span className="text-xs tabular-nums text-[var(--muted)]">
              {formatNativeAmount(schwabUsd, schwabHoldingConfigs[0])}
            </span>
          </li>
          {schwabHoldingConfigs.map((c) => (
            <HoldingLine
              key={c.account}
              config={c}
              amountMinor={amounts.get(c.account) ?? 0}
              totalCnyMinor={totalCnyMinor}
              indent
            />
          ))}
          {overseasHoldings.map((c) => (
            <HoldingLine key={c.account} config={c} amountMinor={amounts.get(c.account) ?? 0} totalCnyMinor={totalCnyMinor} />
          ))}
        </RegionCard>

        <RegionCard title="国内" caption="人民币" subtotalMinor={domesticCny}>
          {domesticHoldings.map((c) => (
            <HoldingLine key={c.account} config={c} amountMinor={amounts.get(c.account) ?? 0} totalCnyMinor={totalCnyMinor} />
          ))}
        </RegionCard>
      </div>

      <ChangeLog logs={logs} />
    </div>
  );
}
