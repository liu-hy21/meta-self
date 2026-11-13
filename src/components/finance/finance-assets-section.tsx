import Link from "next/link";
import type { FinanceHoldingAccount, FinanceHoldingLog, FinanceLargeExpense } from "@prisma/client";

import { FinanceAssetAllocationPie } from "@/components/finance/finance-asset-allocation-pie";
import { FinanceAssetMetricsDashboard } from "@/components/finance/finance-asset-metrics-dashboard";
import { FinanceAssetTrendChart, type AssetTrendPoint } from "@/components/finance/finance-asset-trend-chart";
import { FinanceLargeExpenseAiCard } from "@/components/finance/finance-large-expense-ai-card";
import { FinanceLargeExpensesCard } from "@/components/finance/finance-large-expenses-card";
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
import { buildFinanceAssetMetrics } from "@/lib/finance-asset-metrics";
import {
  financeCard,
  financeCardHeaderPadding,
  financeCardPadding,
  financeModuleTitle,
  financeRowPadding,
  financeStackGap,
} from "@/components/finance/finance-ui-tokens";

type HoldingRow = {
  account: FinanceHoldingAccount;
  amountMinor: number;
  quantityMinor: number | null;
  priceUsdMinor: number | null;
  priceCnyMinor: number | null;
  priceFetchedAt: Date | null;
};

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
    <li className={`group ${financeRowPadding} transition-colors hover:bg-[var(--ink)]/[0.025] ${indent ? "pl-10" : ""}`}>
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
                ? "指数基金"
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
  embedded = false,
  className = "",
}: {
  title: string;
  caption: string;
  subtotalMinor: number;
  children: React.ReactNode;
  embedded?: boolean;
  className?: string;
}) {
  return (
    <section className={`${embedded ? "" : financeCard} overflow-hidden ${className}`}>
      <header className={`flex items-end justify-between gap-3 border-b border-[var(--ink)]/[0.07] ${financeCardHeaderPadding}`}>
        <div>
          <h3 className={financeModuleTitle}>{title}</h3>
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
    <details className={`${financeCard} group/history ${financeCardPadding}`} aria-label="变更记录">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <h3 className={financeModuleTitle}>变更记录</h3>
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

function FinanceRegionBlocks({
  amounts,
  holdingByAccount,
  marketPrices,
  marketPriceCurrencies,
  totalCnyMinor,
  techDefenseHoldings,
  techDefenseCny,
  consumerDefenseHoldings,
  consumerDefenseCny,
  overseasCny,
  domesticCny,
  schwabUsd,
}: {
  amounts: Map<FinanceHoldingAccount, number>;
  holdingByAccount: Map<FinanceHoldingAccount, HoldingRow>;
  marketPrices: Record<string, number | null>;
  marketPriceCurrencies: Record<string, "USD" | "CNY" | null>;
  totalCnyMinor: number;
  techDefenseHoldings: HoldingConfig[];
  techDefenseCny: number;
  consumerDefenseHoldings: HoldingConfig[];
  consumerDefenseCny: number;
  overseasCny: number;
  domesticCny: number;
  schwabUsd: number;
}) {
  const holding = (config: HoldingConfig, indent = false) => (
    <HoldingLine
      key={config.account}
      config={config}
      amountMinor={amounts.get(config.account) ?? 0}
      totalCnyMinor={totalCnyMinor}
      quantityMinor={holdingByAccount.get(config.account)?.quantityMinor ?? null}
      marketPriceMinor={marketPrices[config.account] ?? null}
      marketPriceCurrency={marketPriceCurrencies[config.account] ?? null}
      priceFetchedAt={holdingByAccount.get(config.account)?.priceFetchedAt ?? null}
      indent={indent}
    />
  );

  return (
    <div className="grid border-t border-[var(--ink)]/[0.1] lg:grid-cols-2">
      <RegionCard
        title="海外"
        caption={`美元 × ${USD_TO_CNY} · 港币 × ${HKD_TO_CNY}`}
        subtotalMinor={overseasCny}
        embedded
        className="lg:border-r lg:border-[var(--ink)]/[0.1]"
      >
        <li className={`flex items-center justify-between bg-[var(--ink)]/[0.02] ${financeCardHeaderPadding}`}>
          <span className="text-xs font-semibold tracking-[0.2em] text-[var(--ink)]">SCHWAB</span>
          <FinanceSensitiveAmount className="text-xs tabular-nums text-[var(--muted)]">
            {formatNativeAmount(schwabUsd, schwabHoldingConfigs[0])}
          </FinanceSensitiveAmount>
        </li>
        {schwabHoldingConfigs.filter((c) => c.account === "SCHWAB_OTHER").map((c) => holding(c, true))}
        <li className={`border-t border-[var(--ink)]/[0.06] ${financeRowPadding} pl-10`}>
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
            <ul className="-mx-6 mt-3 divide-y divide-[var(--ink)]/[0.05] border-t border-[var(--ink)]/[0.06]">
              {techDefenseHoldings.map((c) => holding(c, true))}
            </ul>
          </details>
        </li>
        <li className={`border-t border-[var(--ink)]/[0.06] ${financeRowPadding} pl-10`}>
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
            <ul className="-mx-6 mt-3 divide-y divide-[var(--ink)]/[0.05] border-t border-[var(--ink)]/[0.06]">
              {consumerDefenseHoldings.map((c) => holding(c, true))}
            </ul>
          </details>
        </li>
        {schwabHoldingConfigs
          .filter((c) => c.account === "SCHWAB_QQQ" || c.account === "SCHWAB_VOO")
          .map((c) => holding(c, true))}
        {schwabHoldingConfigs.filter((c) => c.account === "SCHWAB_CASH").map((c) => holding(c, true))}
        {overseasHoldings.map((c) => holding(c))}
      </RegionCard>

      <RegionCard title="国内" caption="人民币" subtotalMinor={domesticCny} embedded>
        {domesticHoldings.map((c) => holding(c))}
      </RegionCard>
    </div>
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
  largeExpenses,
  largeExpenseTotal,
  largeExpensePage,
  largeExpensePageCount,
  largeExpenseError,
  yearOptions,
  selectedYear,
  selectedYearTotalMinor,
  selectedYearTypeTotals,
}: {
  holdings: HoldingRow[];
  logs: FinanceHoldingLog[];
  trendPoints: AssetTrendPoint[];
  editing: boolean;
  assetsError?: "required" | "invalid" | "price-unavailable";
  assetsNotice?: "stale-price";
  assetsNoticeAsset?: string;
  largeExpenses: FinanceLargeExpense[];
  largeExpenseTotal: number;
  largeExpensePage: number;
  largeExpensePageCount: number;
  largeExpenseError?: "required";
  yearOptions: Array<{ year: number; totalMinor: number }>;
  selectedYear: number | null;
  selectedYearTotalMinor: number | null;
  selectedYearTypeTotals: Array<{ type: FinanceLargeExpense["type"]; amountMinor: number }>;
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
        <div className={financeStackGap}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className={financeModuleTitle}>更新资产</h2>
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
  const assetMetrics = buildFinanceAssetMetrics(amounts);
  const sum = (configs: HoldingConfig[]) =>
    configs.reduce((s, c) => s + holdingToCnyMinor(amounts.get(c.account) ?? 0, c), 0);
  const overseasCny = sum([...schwabHoldingConfigs, ...overseasHoldings]);
  const domesticCny = sum(domesticHoldings);
  const schwabUsd = schwabTotalUsdMinor(amounts);
  const techDefenseHoldings = schwabHoldingConfigs.filter(isTechDefenseHolding);
  const techDefenseCny = sum(techDefenseHoldings);
  const consumerDefenseHoldings = schwabHoldingConfigs.filter(isConsumerDefenseHolding);
  const consumerDefenseCny = sum(consumerDefenseHoldings);

  return (
    <FinanceVisibilityProvider>
      <div className={financeStackGap}>
      {assetsNotice === "stale-price" ? (
        <p className="rounded-xl border border-[#c29a5b]/30 bg-[#c29a5b]/[0.1] px-4 py-3 text-sm text-[#765a2d]" role="status">
          {assetsNoticeAsset ?? "QQQ / VOO"} 暂时沿用了上次缓存价格。
        </p>
      ) : null}
      <section className={`${financeCard} overflow-hidden`}>
        <div className="grid lg:grid-cols-2">
          <div className={`bg-[var(--ink)] ${financeCardPadding} text-[var(--panel)]`}>
            <FinanceAssetTrendChart
              points={trendPoints}
              dark
              actions={
                <div className="flex items-center gap-2">
                  <FinanceVisibilityToggle className="border-[var(--panel)]/30 text-[var(--panel)] hover:bg-[var(--panel)]/10" />
                  <Link
                    href="/finance/profile?edit=1"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--panel)] px-4 text-sm font-medium text-[var(--ink)] transition-transform hover:-translate-y-px"
                  >
                    更新资产
                  </Link>
                </div>
              }
            />
          </div>

          <div className={financeCardPadding}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className={financeModuleTitle}>资产结构</h3>
              <Link
                href="/finance/analysis?view=signals"
                className="inline-flex h-8 items-center border border-[var(--ink)]/20 px-2.5 text-xs text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--gold)]"
              >
                数据分析
              </Link>
            </div>
            <FinanceAssetAllocationPie slices={slices} sliceStates={assetMetrics.layerStatus} showStatus />
          </div>
        </div>
        <FinanceRegionBlocks
          amounts={amounts}
          holdingByAccount={holdingByAccount}
          marketPrices={marketPrices}
          marketPriceCurrencies={marketPriceCurrencies}
          totalCnyMinor={totalCnyMinor}
          techDefenseHoldings={techDefenseHoldings}
          techDefenseCny={techDefenseCny}
          consumerDefenseHoldings={consumerDefenseHoldings}
          consumerDefenseCny={consumerDefenseCny}
          overseasCny={overseasCny}
          domesticCny={domesticCny}
          schwabUsd={schwabUsd}
        />
      </section>

      <FinanceAssetMetricsDashboard />

      <div className="grid gap-6 xl:grid-cols-2">
        <FinanceLargeExpensesCard
          expenses={largeExpenses}
          total={largeExpenseTotal}
          page={largeExpensePage}
          pageCount={largeExpensePageCount}
          error={largeExpenseError}
          yearOptions={yearOptions}
          selectedYear={selectedYear}
          selectedYearTotalMinor={selectedYearTotalMinor}
          selectedYearTypeTotals={selectedYearTypeTotals}
        />
        <FinanceLargeExpenseAiCard
          key={selectedYear == null ? "all" : String(selectedYear)}
          selectedYear={selectedYear}
        />
      </div>

      <ChangeLog logs={logs} />
      </div>
    </FinanceVisibilityProvider>
  );
}
