import Link from "next/link";
import type { FinanceHoldingAccount, FinanceHoldingLog } from "@prisma/client";

import { FinanceAssetAllocationPie } from "@/components/finance/finance-asset-allocation-pie";
import { FinanceAssetTrendChart, type AssetTrendPoint } from "@/components/finance/finance-asset-trend-chart";
import { FinanceHoldingsForm } from "@/components/finance/finance-holdings-form";
import {
  FinanceSensitiveAmount,
  FinanceVisibilityProvider,
  FinanceVisibilityToggle,
} from "@/components/finance/finance-visibility";
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
  isConsumerDefenseHolding,
  isMarketPricedHolding,
  isTechDefenseHolding,
  overseasHoldings,
  schwabHoldingConfigs,
  schwabTotalUsdMinor,
  splitCnyMinor,
  USD_TO_CNY,
  type HoldingConfig,
} from "@/lib/finance-holdings";

type HoldingRow = {
  account: FinanceHoldingAccount;
  amountMinor: number;
  quantityMinor: number | null;
  priceUsdMinor: number | null;
  priceCnyMinor: number | null;
  priceFetchedAt: Date | null;
};

const card = "rounded-2xl border border-[var(--ink)]/10 bg-[var(--panel)] shadow-[0_1px_2px_rgba(28,25,23,0.04)]";
const eyebrow = "text-[11px] tracking-[0.2em] text-[var(--muted)]";

function Yuan({ minor, className = "" }: { minor: number; className?: string }) {
  const { integer, decimal } = splitCnyMinor(minor);
  return (
    <FinanceSensitiveAmount className={`tabular-nums ${className}`}>
      ¥{integer}
      <span className="opacity-45">.{decimal}</span>
    </FinanceSensitiveAmount>
  );
}

function HoldingLine({
  config,
  amountMinor,
  totalCnyMinor,
  quantityMinor,
  marketPriceMinor,
  marketPriceCurrency,
  priceFetchedAt,
  label,
  indent = false,
}: {
  config: HoldingConfig;
  amountMinor: number;
  totalCnyMinor: number;
  quantityMinor: number | null;
  marketPriceMinor: number | null;
  marketPriceCurrency: "USD" | "CNY" | null;
  priceFetchedAt: Date | null;
  label?: string;
  indent?: boolean;
}) {
  const cny = holdingToCnyMinor(amountMinor, config);
  const share = totalCnyMinor > 0 ? (cny / totalCnyMinor) * 100 : 0;
  const allocation = accountAllocation(config.account);
  const marketPriced = isMarketPricedHolding(config);
  const quantityUnit = config.inputKind === "weight" ? "克" : "股";
  const priceSymbol = marketPriceCurrency === "CNY" ? "¥" : "$";
  const priceDate = priceFetchedAt
    ? priceFetchedAt.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit" })
    : null;
  return (
    <li className={`group px-5 py-3.5 transition-colors hover:bg-[var(--ink)]/[0.025] ${indent ? "pl-9" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: allocation.color }} aria-hidden />
            {label ?? config.label}
          </p>
          <p className="mt-0.5 pl-3.5 text-[11px] text-[var(--muted)]">
            {marketPriced && quantityMinor != null
              ? `${(quantityMinor / 100).toFixed(2)} ${quantityUnit} · ${marketPriceMinor != null ? `价格 ${priceSymbol}${(marketPriceMinor / 100).toFixed(2)}${priceDate ? ` · ${priceDate}` : ""}` : "等待价格"}`
              : allocation.label === config.label
                ? "指数 ETF"
                : allocation.label}
          </p>
        </div>
        <div className="text-right">
          <FinanceSensitiveAmount className="text-sm font-medium tabular-nums text-[var(--ink)]">
            {formatNativeAmount(amountMinor, config)}
          </FinanceSensitiveAmount>
          <p className="mt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
            {config.currency !== "CNY" ? (
              <>
                <FinanceSensitiveAmount>≈ ¥{splitCnyMinor(cny).integer}</FinanceSensitiveAmount> · {" "}
              </>
            ) : null}
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
              <FinanceSensitiveAmount>
                {delta > 0 ? "+" : "-"}¥{splitCnyMinor(Math.abs(delta)).integer}
              </FinanceSensitiveAmount>
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
              {log.previousAmountMinor == null ? null : (
                <FinanceSensitiveAmount>
                  {formatNativeAmount(log.previousAmountMinor, config)} → {" "}
                </FinanceSensitiveAmount>
              )}
              <FinanceSensitiveAmount>{formatNativeAmount(log.newAmountMinor, config)}</FinanceSensitiveAmount>
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
    <details className={`${card} group/history p-6`} aria-label="变更记录">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <p className={eyebrow}>HISTORY</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--ink)]">变更记录</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">共 {groups.length} 次保存</span>
          <svg viewBox="0 0 20 20" className="size-4 text-[var(--muted)] transition-transform duration-200 group-open/history:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </div>
      </summary>
      {groups.length === 0 ? (
        <p className="pt-6 text-sm text-[var(--muted)]">还没有修改记录。</p>
      ) : (
        <div className="pt-6">
          <ol>
            {shown.map((g, i) => (
              <LogEntry key={g.key} group={g} previousTotal={prevTotal(i)} />
            ))}
          </ol>
          {rest.length > 0 ? (
            <details className="group/more mt-6">
              <summary className="min-h-11 cursor-pointer list-none pt-2 text-sm text-[var(--gold-deep)] hover:underline">
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
        </div>
      )}
    </details>
  );
}

export function FinanceAssetsSection({
  holdings,
  logs,
  trendPoints,
  editing,
  assetsError,
  assetsNotice,
  assetsNoticeAsset,
}: {
  holdings: HoldingRow[];
  logs: FinanceHoldingLog[];
  trendPoints: AssetTrendPoint[];
  editing: boolean;
  assetsError?: "required" | "invalid" | "price-unavailable";
  assetsNotice?: "stale-price";
  assetsNoticeAsset?: string;
}) {
  const amounts = new Map<FinanceHoldingAccount, number>(financeHoldingConfigs.map((c) => [c.account, 0]));
  for (const h of holdings) amounts.set(h.account, h.amountMinor);
  const holdingByAccount = new Map(holdings.map((holding) => [holding.account, holding]));
  const initialQuantities = Object.fromEntries(
    financeHoldingConfigs.map((config) => [config.account, holdingByAccount.get(config.account)?.quantityMinor ?? null]),
  );
  const marketPrices = Object.fromEntries(
    financeHoldingConfigs.map((config) => [
      config.account,
      config.marketPriceCurrency === "CNY"
        ? holdingByAccount.get(config.account)?.priceCnyMinor ?? null
        : holdingByAccount.get(config.account)?.priceUsdMinor ?? null,
    ]),
  );
  const marketPriceCurrencies = Object.fromEntries(
    financeHoldingConfigs.map((config) => [config.account, isMarketPricedHolding(config) ? config.marketPriceCurrency ?? "USD" : null]),
  );
  const priceFetchedAt = Object.fromEntries(
    financeHoldingConfigs.map((config) => [config.account, holdingByAccount.get(config.account)?.priceFetchedAt ?? null]),
  );

  if (editing) {
    return (
      <FinanceVisibilityProvider>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={eyebrow}>UPDATE SNAPSHOT</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">更新资产</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">按当前实际余额填写全部账户，保存后生成今日快照。</p>
            </div>
            <FinanceVisibilityToggle className="border-[var(--ink)]/15 text-[var(--ink)] hover:bg-[var(--ink)]/[0.05]" />
          </div>
          <FinanceHoldingsForm
            initial={Object.fromEntries(amounts)}
            initialQuantities={initialQuantities}
            marketPrices={marketPrices}
            marketPriceCurrencies={marketPriceCurrencies}
            priceFetchedAt={priceFetchedAt}
            error={assetsError}
            notice={assetsNotice}
            noticeAsset={assetsNoticeAsset}
          />
        </div>
      </FinanceVisibilityProvider>
    );
  }

  const totalCnyMinor = computeTotalCnyMinor(amounts);
  const slices = computeAllocationCnyMinor(amounts);
  const sum = (configs: HoldingConfig[]) =>
    configs.reduce((s, c) => s + holdingToCnyMinor(amounts.get(c.account) ?? 0, c), 0);
  const overseasCny = sum([...schwabHoldingConfigs, ...overseasHoldings]);
  const domesticCny = sum(domesticHoldings);
  const schwabUsd = schwabTotalUsdMinor(amounts);
  const techDefenseHoldings = schwabHoldingConfigs.filter(isTechDefenseHolding);
  const techDefenseCny = sum(techDefenseHoldings);
  const consumerDefenseHoldings = schwabHoldingConfigs.filter(isConsumerDefenseHolding);
  const consumerDefenseCny = sum(consumerDefenseHoldings);

  const sortedPoints = [...trendPoints].sort((a, b) => a.date.localeCompare(b.date));
  const previous = sortedPoints.length >= 2 ? sortedPoints[sortedPoints.length - 2] : null;
  const latest = sortedPoints[sortedPoints.length - 1] ?? null;
  const delta = previous ? totalCnyMinor - previous.totalCnyMinor : null;
  const deltaPct = previous && previous.totalCnyMinor > 0 && delta != null ? (delta / previous.totalCnyMinor) * 100 : null;
  const { integer, decimal } = splitCnyMinor(totalCnyMinor);

  return (
    <FinanceVisibilityProvider>
      <div className="space-y-6">
      {assetsNotice === "stale-price" ? (
        <p className="rounded-xl border border-[#c29a5b]/30 bg-[#c29a5b]/[0.1] px-4 py-3 text-sm text-[#765a2d]" role="status">
          {assetsNoticeAsset ?? "QQQ / VOO"} 暂时沿用了上次缓存价格。
        </p>
      ) : null}
      <section className={`${card} grid overflow-hidden xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,1fr)]`}>
        <div className="flex flex-col justify-between gap-8 bg-[var(--ink)] p-7 text-[var(--panel)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.25em] opacity-60">NET ASSETS · CNY</p>
              <p className="mt-1 text-sm opacity-80">总资产</p>
            </div>
            <div className="flex items-center gap-2">
              <FinanceVisibilityToggle className="border-[var(--panel)]/30 text-[var(--panel)] hover:bg-[var(--panel)]/10" />
              <Link
                href="/finance/profile?edit=1"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--panel)] px-4 text-sm font-medium text-[var(--ink)] transition-transform hover:-translate-y-px"
              >
                更新资产
              </Link>
            </div>
          </div>

          <div>
            <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              <FinanceSensitiveAmount>
              ¥{integer}
              <span className="text-2xl opacity-40 sm:text-3xl">.{decimal}</span>
              </FinanceSensitiveAmount>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {delta != null && previous ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${
                    delta >= 0 ? "bg-[#9fc7b3]/15 text-[#9fc7b3]" : "bg-[#e3a593]/15 text-[#e3a593]"
                  }`}
                >
                  <FinanceSensitiveAmount>
                    {delta >= 0 ? "▲" : "▼"} ¥{splitCnyMinor(Math.abs(delta)).integer}
                  </FinanceSensitiveAmount>
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
              <dd className="mt-1 text-lg font-medium tabular-nums">
                <FinanceSensitiveAmount>¥{splitCnyMinor(overseasCny).integer}</FinanceSensitiveAmount>
              </dd>
            </div>
            <div>
              <dt className="text-xs opacity-50">国内</dt>
              <dd className="mt-1 text-lg font-medium tabular-nums">
                <FinanceSensitiveAmount>¥{splitCnyMinor(domesticCny).integer}</FinanceSensitiveAmount>
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-7 sm:p-8">
          <p className={eyebrow}>ALLOCATION</p>
          <div className="mb-6 mt-1 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--ink)]">资产结构</h3>
            <Link
              href="/finance/analysis?view=signals"
              className="inline-flex h-8 items-center border border-[var(--ink)]/20 px-2.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--gold)]"
            >
              数据分析
            </Link>
          </div>
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
            <FinanceSensitiveAmount className="text-xs tabular-nums text-[var(--muted)]">
              {formatNativeAmount(schwabUsd, schwabHoldingConfigs[0])}
            </FinanceSensitiveAmount>
          </li>
          {schwabHoldingConfigs.filter((c) => c.account === "SCHWAB_OTHER").map((c) => (
            <HoldingLine
              key={c.account}
              config={c}
              amountMinor={amounts.get(c.account) ?? 0}
              totalCnyMinor={totalCnyMinor}
              quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
              indent
            />
          ))}
          <li className="border-t border-[var(--ink)]/[0.06] py-3.5 pl-9 pr-5">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b3644d]" aria-hidden />
                  科技防守层
                </span>
                <span className="text-xs tabular-nums text-[var(--muted)]">
                  {techDefenseHoldings.length} 项 · <Yuan minor={techDefenseCny} /> <span aria-hidden>⌄</span>
                </span>
              </summary>
              <ul className="-mx-5 mt-3 divide-y divide-[var(--ink)]/[0.05] border-t border-[var(--ink)]/[0.06]">
                {techDefenseHoldings.map((c) => (
                  <HoldingLine
                    key={c.account}
                    config={c}
                    amountMinor={amounts.get(c.account) ?? 0}
                    totalCnyMinor={totalCnyMinor}
                    quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
                    marketPriceMinor={marketPrices[c.account] ?? null}
                    marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
                    priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
                    indent
                  />
                ))}
              </ul>
            </details>
          </li>
          <li className="border-t border-[var(--ink)]/[0.06] py-3.5 pl-9 pr-5">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7f9c94]" aria-hidden />
                  消费防守层
                </span>
                <span className="text-xs tabular-nums text-[var(--muted)]">
                  {consumerDefenseHoldings.length} 项 · <Yuan minor={consumerDefenseCny} /> <span aria-hidden>⌄</span>
                </span>
              </summary>
              <ul className="-mx-5 mt-3 divide-y divide-[var(--ink)]/[0.05] border-t border-[var(--ink)]/[0.06]">
                {consumerDefenseHoldings.map((c) => (
                  <HoldingLine
                    key={c.account}
                    config={c}
                    amountMinor={amounts.get(c.account) ?? 0}
                    totalCnyMinor={totalCnyMinor}
                    quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
                    marketPriceMinor={marketPrices[c.account] ?? null}
                    marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
                    priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
                    indent
                  />
                ))}
              </ul>
            </details>
          </li>
          {schwabHoldingConfigs
            .filter((c) => c.account === "SCHWAB_QQQ" || c.account === "SCHWAB_VOO")
            .map((c) => (
              <HoldingLine
                key={c.account}
                config={c}
                amountMinor={amounts.get(c.account) ?? 0}
                totalCnyMinor={totalCnyMinor}
                quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
                marketPriceMinor={marketPrices[c.account] ?? null}
                marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
                priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
                indent
              />
            ))}
          {schwabHoldingConfigs.filter((c) => c.account === "SCHWAB_CASH").map((c) => (
            <HoldingLine
              key={c.account}
              config={c}
              amountMinor={amounts.get(c.account) ?? 0}
              totalCnyMinor={totalCnyMinor}
              quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
              indent
            />
          ))}
          {overseasHoldings.map((c) => (
            <HoldingLine
              key={c.account}
              config={c}
              amountMinor={amounts.get(c.account) ?? 0}
              totalCnyMinor={totalCnyMinor}
              quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
            />
          ))}
        </RegionCard>

        <RegionCard title="国内" caption="人民币" subtotalMinor={domesticCny}>
          {domesticHoldings.map((c) => (
            <HoldingLine
              key={c.account}
              config={c}
              amountMinor={amounts.get(c.account) ?? 0}
              totalCnyMinor={totalCnyMinor}
              quantityMinor={holdingByAccount.get(c.account)?.quantityMinor ?? null}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={holdingByAccount.get(c.account)?.priceFetchedAt ?? null}
            />
          ))}
        </RegionCard>
      </div>

      <ChangeLog logs={logs} />
      </div>
    </FinanceVisibilityProvider>
  );
}
