"use client";

import Link from "next/link";
import { useState } from "react";

import { upsertFinanceHoldings } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { FinanceSensitiveAmount } from "@/components/finance/finance-visibility";
import {
  accountAllocation,
  computeAllocationCnyMinor,
  domesticHoldings,
  financeHoldingConfigs,
  holdingToCnyMinor,
  isConsumerDefenseHolding,
  isMarketPricedHolding,
  isTechDefenseHolding,
  overseasHoldings,
  schwabHoldingConfigs,
  splitCnyMinor,
  type HoldingConfig,
} from "@/lib/finance-holdings";
import { sharesToAmountMinor } from "@/lib/finance-prices";
import {
  financeCard,
  financeCardHeaderPadding,
  financeCardPadding,
  financeDarkCard,
  financeModuleGap,
  financeModuleTitle,
  financeRowPadding,
  financeStackGap,
} from "@/components/finance/finance-ui-tokens";
import type { FinanceHoldingAccount } from "@prisma/client";

const currencySymbol: Record<HoldingConfig["currency"], string> = { USD: "$", HKD: "HK$", CNY: "¥" };

function parseMinor(raw: string) {
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function formatMarketPriceMinor(minor: number, currency: "USD" | "CNY") {
  const symbol = currency === "CNY" ? "¥" : "$";
  return `${symbol}${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPriceDate(date: Date | null) {
  if (!date) return "保存时更新价格";
  return date.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit" });
}

function HoldingField({
  config,
  value,
  onChange,
  marketPriceMinor,
  marketPriceCurrency,
  priceFetchedAt,
}: {
  config: HoldingConfig;
  value: string;
  onChange: (v: string) => void;
  marketPriceMinor: number | null;
  marketPriceCurrency: "USD" | "CNY" | null;
  priceFetchedAt: Date | null;
}) {
  const allocation = accountAllocation(config.account);
  const inputMinor = parseMinor(value);
  const empty = value.trim() === "";
  const marketPriced = isMarketPricedHolding(config);
  const amountMinor =
    inputMinor == null
      ? null
      : marketPriced
        ? marketPriceMinor != null
          ? sharesToAmountMinor(inputMinor, marketPriceMinor)
          : null
        : inputMinor;
  const cnyMinor = amountMinor == null ? null : holdingToCnyMinor(amountMinor, config);

  return (
    <label className={`group flex items-center gap-4 ${financeRowPadding} transition-colors focus-within:bg-[var(--ink)]/[0.03]`}>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm text-[var(--ink)]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: allocation.color }} aria-hidden />
          {config.label}
        </span>
        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
          {marketPriced
            ? marketPriceMinor != null
              ? (
                  <>
                    {formatMarketPriceMinor(marketPriceMinor, marketPriceCurrency ?? "USD")} · {formatPriceDate(priceFetchedAt)} · {" "}
                    <FinanceSensitiveAmount>≈ ¥{splitCnyMinor(cnyMinor ?? 0).integer}</FinanceSensitiveAmount>
                  </>
                )
              : "价格将在保存时更新"
            : (
                <>
                  {config.currencyLabel}
                  {config.currency !== "CNY" && cnyMinor != null ? (
                    <>
                      {" · "}
                      <FinanceSensitiveAmount>≈ ¥{splitCnyMinor(cnyMinor).integer}</FinanceSensitiveAmount>
                    </>
                  ) : null}
                </>
              )}
        </span>
      </span>
      <span
        className={`flex w-44 items-center rounded-lg border bg-[var(--panel)] px-3 transition-colors focus-within:border-[var(--gold-deep)] ${
          empty ? "border-[#b3644d]/40" : "border-[var(--ink)]/12"
        }`}
      >
        <span className="text-sm text-[var(--muted)]">
          {config.inputKind === "weight" ? "克" : marketPriced ? "股" : currencySymbol[config.currency]}
        </span>
        <input
          name={config.formKey}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInvalid={(e) =>
            e.currentTarget.setCustomValidity(
              config.inputKind === "weight"
                ? "请填写克数，没有持仓可填 0"
                : marketPriced
                  ? "请填写股数，没有持仓可填 0"
                  : "请填写该账户金额，没有余额可填 0",
            )
          }
          onInput={(e) => e.currentTarget.setCustomValidity("")}
          className="h-10 w-full min-w-0 bg-transparent pl-2 text-right text-sm tabular-nums text-[var(--ink)] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          placeholder="0.00"
        />
      </span>
    </label>
  );
}

function Group({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <section className={`${financeCard} overflow-hidden`}>
      <header className={`flex items-baseline justify-between border-b border-[var(--ink)]/8 ${financeCardHeaderPadding}`}>
        <h3 className={financeModuleTitle}>{title}</h3>
        <span className="text-[11px] text-[var(--muted)]">{caption}</span>
      </header>
      <div className="divide-y divide-[var(--ink)]/[0.06]">{children}</div>
    </section>
  );
}

type FinanceFormError = "required" | "invalid" | "price-unavailable";

export function FinanceHoldingsForm({
  initial,
  initialQuantities,
  marketPrices,
  marketPriceCurrencies,
  priceFetchedAt,
  error,
  notice,
  noticeAsset,
}: {
  initial: Record<string, number>;
  initialQuantities: Record<string, number | null>;
  marketPrices: Record<string, number | null>;
  marketPriceCurrencies: Record<string, "USD" | "CNY" | null>;
  priceFetchedAt: Record<string, Date | null>;
  error?: FinanceFormError;
  notice?: "stale-price";
  noticeAsset?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      financeHoldingConfigs.map((c) => {
        if (isMarketPricedHolding(c)) {
          const quantityMinor = initialQuantities[c.account];
          const hasLegacyAmount = quantityMinor == null && (initial[c.account] ?? 0) > 0;
          return [c.formKey, hasLegacyAmount ? "" : ((quantityMinor ?? 0) / 100).toFixed(c.decimals)];
        }
        return [c.formKey, ((initial[c.account] ?? 0) / 100).toFixed(c.decimals)];
      }),
    ),
  );

  const set = (key: string) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const amounts = new Map<FinanceHoldingAccount, number>();
  let filled = 0;
  for (const c of financeHoldingConfigs) {
    const inputMinor = parseMinor(values[c.formKey] ?? "");
    if (inputMinor != null) filled += 1;
    const amountMinor =
      inputMinor == null
        ? 0
        : isMarketPricedHolding(c) && marketPrices[c.account] != null
          ? sharesToAmountMinor(inputMinor, marketPrices[c.account]!)
          : inputMinor;
    amounts.set(c.account, amountMinor);
  }
  const slices = computeAllocationCnyMinor(amounts);
  const total = slices.reduce((s, x) => s + x.cnyMinor, 0);
  const initialTotal = computeAllocationCnyMinor(
    new Map(financeHoldingConfigs.map((c) => [c.account, initial[c.account] ?? 0])),
  ).reduce((s, x) => s + x.cnyMinor, 0);
  const diff = total - initialTotal;
  const complete = filled === financeHoldingConfigs.length;
  const techDefenseHoldings = schwabHoldingConfigs.filter(isTechDefenseHolding);
  const techDefenseCny = techDefenseHoldings.reduce(
    (sum, config) => sum + holdingToCnyMinor(amounts.get(config.account) ?? 0, config),
    0,
  );
  const consumerDefenseHoldings = schwabHoldingConfigs.filter(isConsumerDefenseHolding);
  const consumerDefenseCny = consumerDefenseHoldings.reduce(
    (sum, config) => sum + holdingToCnyMinor(amounts.get(config.account) ?? 0, config),
    0,
  );
  const { integer, decimal } = splitCnyMinor(total);

  return (
    <form action={upsertFinanceHoldings} className={`grid ${financeModuleGap} xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start`}>
      <div className={financeStackGap}>
        {error ? (
          <p className="rounded-xl border border-[#b3644d]/30 bg-[#b3644d]/[0.08] px-4 py-3 text-sm text-[#8a4433]" role="alert">
            {error === "required"
              ? "有账户没有填写。所有账户都要填，没有余额可以填 0。"
              : error === "invalid"
                ? "部分金额或股数格式无效，请填写非负数字。"
                : `${noticeAsset ?? "QQQ / VOO"} 暂时取不到价格，尚未保存，请稍后重试。`}
          </p>
        ) : null}
        {notice === "stale-price" ? (
          <p className="rounded-xl border border-[#c29a5b]/30 bg-[#c29a5b]/[0.1] px-4 py-3 text-sm text-[#765a2d]" role="status">
            {noticeAsset ?? "QQQ / VOO"} 暂时沿用了上次缓存价格。
          </p>
        ) : null}

        <Group title="海外" caption="美元 × 7.4 · 港币 × 0.94">
          <div className="bg-[var(--ink)]/[0.02] px-6 pb-1 pt-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--muted)]">
            SCHWAB
          </div>
          {schwabHoldingConfigs.filter((c) => c.account === "SCHWAB_OTHER").map((c) => (
            <HoldingField
              key={c.account}
              config={c}
              value={values[c.formKey]}
              onChange={set(c.formKey)}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={priceFetchedAt[c.account] ?? null}
            />
          ))}
          <details className={`border-t border-[var(--ink)]/[0.06] ${financeRowPadding}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-[var(--ink)] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b3644d]" aria-hidden />
                科技防守层
              </span>
              <span className="text-xs tabular-nums text-[var(--muted)]">
                {techDefenseHoldings.length} 项 · {" "}
                <FinanceSensitiveAmount>≈ ¥{splitCnyMinor(techDefenseCny).integer}</FinanceSensitiveAmount>{" "}
                <span aria-hidden>⌄</span>
              </span>
            </summary>
            <div className="-mx-6 mt-3 divide-y divide-[var(--ink)]/[0.06] border-t border-[var(--ink)]/[0.06]">
              {techDefenseHoldings.map((c) => (
                <HoldingField
                  key={c.account}
                  config={c}
                  value={values[c.formKey]}
                  onChange={set(c.formKey)}
                  marketPriceMinor={marketPrices[c.account] ?? null}
                  marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
                  priceFetchedAt={priceFetchedAt[c.account] ?? null}
                />
              ))}
            </div>
          </details>
          <details className={`border-t border-[var(--ink)]/[0.06] ${financeRowPadding}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-[var(--ink)] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7f9c94]" aria-hidden />
                消费防守层
              </span>
              <span className="text-xs tabular-nums text-[var(--muted)]">
                {consumerDefenseHoldings.length} 项 · {" "}
                <FinanceSensitiveAmount>≈ ¥{splitCnyMinor(consumerDefenseCny).integer}</FinanceSensitiveAmount>{" "}
                <span aria-hidden>⌄</span>
              </span>
            </summary>
            <div className="-mx-6 mt-3 divide-y divide-[var(--ink)]/[0.06] border-t border-[var(--ink)]/[0.06]">
              {consumerDefenseHoldings.map((c) => (
                <HoldingField
                  key={c.account}
                  config={c}
                  value={values[c.formKey]}
                  onChange={set(c.formKey)}
                  marketPriceMinor={marketPrices[c.account] ?? null}
                  marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
                  priceFetchedAt={priceFetchedAt[c.account] ?? null}
                />
              ))}
            </div>
          </details>
          {schwabHoldingConfigs
            .filter((c) => c.account === "SCHWAB_QQQ" || c.account === "SCHWAB_VOO")
            .map((c) => (
              <HoldingField
                key={c.account}
                config={c}
                value={values[c.formKey]}
                onChange={set(c.formKey)}
                marketPriceMinor={marketPrices[c.account] ?? null}
                marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
                priceFetchedAt={priceFetchedAt[c.account] ?? null}
              />
            ))}
          {schwabHoldingConfigs.filter((c) => c.account === "SCHWAB_CASH").map((c) => (
            <HoldingField
              key={c.account}
              config={c}
              value={values[c.formKey]}
              onChange={set(c.formKey)}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={priceFetchedAt[c.account] ?? null}
            />
          ))}
          {overseasHoldings.map((c) => (
            <HoldingField
              key={c.account}
              config={c}
              value={values[c.formKey]}
              onChange={set(c.formKey)}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={priceFetchedAt[c.account] ?? null}
            />
          ))}
        </Group>

        <Group title="国内" caption="人民币">
          {domesticHoldings.map((c) => (
            <HoldingField
              key={c.account}
              config={c}
              value={values[c.formKey]}
              onChange={set(c.formKey)}
              marketPriceMinor={marketPrices[c.account] ?? null}
              marketPriceCurrency={marketPriceCurrencies[c.account] ?? null}
              priceFetchedAt={priceFetchedAt[c.account] ?? null}
            />
          ))}
        </Group>
      </div>

      <aside className={`${financeDarkCard} ${financeStackGap} ${financeCardPadding} lg:sticky lg:top-6`}>
        <div>
          <p className="text-[11px] tracking-[0.2em] opacity-60">预览合计 · 人民币</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            <FinanceSensitiveAmount>
              ¥{integer}
              <span className="text-lg opacity-50">.{decimal}</span>
            </FinanceSensitiveAmount>
          </p>
          <p className={`mt-1 text-xs tabular-nums ${diff === 0 ? "opacity-50" : diff > 0 ? "text-[#9fc7b3]" : "text-[#e3a593]"}`}>
            {diff === 0 ? (
              "与当前一致"
            ) : (
              <>
                <FinanceSensitiveAmount>
                  {diff > 0 ? "+" : "-"}¥{splitCnyMinor(Math.abs(diff)).integer}
                </FinanceSensitiveAmount>{" "}
                较当前
              </>
            )}
          </p>
        </div>

        <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
          {slices.map((s) =>
            total > 0 && s.cnyMinor > 0 ? (
              <div
                key={s.key}
                className="h-full transition-[width] duration-300"
                style={{ width: `${(s.cnyMinor / total) * 100}%`, backgroundColor: s.color }}
              />
            ) : null,
          )}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {slices.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 opacity-80">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums opacity-60">
                {total > 0 ? ((s.cnyMinor / total) * 100).toFixed(0) : 0}%
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-60">填写进度</span>
            <span className="tabular-nums">
              {filled} / {financeHoldingConfigs.length}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--gold)] transition-[width] duration-300"
              style={{ width: `${(filled / financeHoldingConfigs.length) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed opacity-50">
            {complete ? "全部已填写，保存后会记录今日快照与变更日志。" : "所有账户都要填写才能保存，没有余额可填 0。"}
          </p>
        </div>

        <div className="flex items-center gap-3 [&_button]:flex-1">
          <Link
            href="/finance/profile"
            className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm opacity-70 transition-opacity hover:opacity-100"
          >
            取消
          </Link>
          <SaveButton label={complete ? "保存快照" : "请填完所有账户"} />
        </div>
      </aside>
    </form>
  );
}
