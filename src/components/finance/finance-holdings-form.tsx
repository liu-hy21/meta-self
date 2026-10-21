"use client";

import Link from "next/link";
import { useState } from "react";

import { upsertFinanceHoldings } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import {
  accountAllocation,
  computeAllocationCnyMinor,
  domesticHoldings,
  financeHoldingConfigs,
  holdingToCnyMinor,
  overseasHoldings,
  schwabHoldingConfigs,
  splitCnyMinor,
  type HoldingConfig,
} from "@/lib/finance-holdings";
import type { FinanceHoldingAccount } from "@prisma/client";

const currencySymbol: Record<HoldingConfig["currency"], string> = { USD: "$", HKD: "HK$", CNY: "¥" };

function parseMinor(raw: string) {
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function AmountField({
  config,
  value,
  onChange,
  title,
}: {
  config: HoldingConfig;
  value: string;
  onChange: (v: string) => void;
  title?: string;
}) {
  const allocation = accountAllocation(config.account);
  const minor = parseMinor(value);
  const empty = value.trim() === "";
  return (
    <label className="group flex items-center gap-4 px-5 py-3.5 transition-colors focus-within:bg-[var(--ink)]/[0.03]">
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm text-[var(--ink)]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: allocation.color }} aria-hidden />
          {title ?? config.label}
        </span>
        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
          {config.currencyLabel}
          {config.currency !== "CNY" && minor != null
            ? ` · ≈ ¥${splitCnyMinor(holdingToCnyMinor(minor, config)).integer}`
            : ""}
        </span>
      </span>
      <span
        className={`flex w-44 items-center rounded-lg border bg-[var(--panel)] px-3 transition-colors focus-within:border-[var(--gold-deep)] ${
          empty ? "border-[#b3644d]/40" : "border-[var(--ink)]/12"
        }`}
      >
        <span className="text-sm text-[var(--muted)]">{currencySymbol[config.currency]}</span>
        <input
          name={config.formKey}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInvalid={(e) => e.currentTarget.setCustomValidity("请填写该账户金额，没有余额可填 0")}
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
    <section className="overflow-hidden rounded-2xl border border-[var(--ink)]/10 bg-[var(--panel)]">
      <header className="flex items-baseline justify-between border-b border-[var(--ink)]/8 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-wide text-[var(--ink)]">{title}</h3>
        <span className="text-[11px] text-[var(--muted)]">{caption}</span>
      </header>
      <div className="divide-y divide-[var(--ink)]/[0.06]">{children}</div>
    </section>
  );
}

export function FinanceHoldingsForm({
  initial,
  error,
}: {
  initial: Record<string, number>;
  error?: "required" | "invalid";
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      financeHoldingConfigs.map((c) => [c.formKey, ((initial[c.account] ?? 0) / 100).toFixed(c.decimals)]),
    ),
  );

  const set = (key: string) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const amounts = new Map<FinanceHoldingAccount, number>();
  let filled = 0;
  for (const c of financeHoldingConfigs) {
    const minor = parseMinor(values[c.formKey] ?? "");
    if (minor != null) filled += 1;
    amounts.set(c.account, minor ?? 0);
  }
  const slices = computeAllocationCnyMinor(amounts);
  const total = slices.reduce((s, x) => s + x.cnyMinor, 0);
  const initialTotal = computeAllocationCnyMinor(
    new Map(financeHoldingConfigs.map((c) => [c.account, initial[c.account] ?? 0])),
  ).reduce((s, x) => s + x.cnyMinor, 0);
  const diff = total - initialTotal;
  const complete = filled === financeHoldingConfigs.length;
  const { integer, decimal } = splitCnyMinor(total);

  return (
    <form action={upsertFinanceHoldings} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start">
      <div className="space-y-6">
        {error ? (
          <p className="rounded-xl border border-[#b3644d]/30 bg-[#b3644d]/[0.08] px-4 py-3 text-sm text-[#8a4433]" role="alert">
            {error === "required"
              ? "有账户没有填写。所有账户都要填，没有余额可以填 0。"
              : "部分金额格式无效，请填写非负数字。"}
          </p>
        ) : null}

        <Group title="海外" caption="美元 × 7.4 · 港币 × 0.94">
          <div className="bg-[var(--ink)]/[0.02] px-5 pb-1 pt-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--muted)]">
            SCHWAB
          </div>
          {schwabHoldingConfigs.map((c) => (
            <AmountField key={c.account} config={c} value={values[c.formKey]} onChange={set(c.formKey)} />
          ))}
          {overseasHoldings.map((c) => (
            <AmountField key={c.account} config={c} value={values[c.formKey]} onChange={set(c.formKey)} />
          ))}
        </Group>

        <Group title="国内" caption="人民币">
          {domesticHoldings.map((c) => (
            <AmountField key={c.account} config={c} value={values[c.formKey]} onChange={set(c.formKey)} />
          ))}
        </Group>
      </div>

      <aside className="space-y-5 rounded-2xl bg-[var(--ink)] p-6 text-[var(--panel)] lg:sticky lg:top-6">
        <div>
          <p className="text-[11px] tracking-[0.2em] opacity-60">预览合计 · 人民币</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            ¥{integer}
            <span className="text-lg opacity-50">.{decimal}</span>
          </p>
          <p className={`mt-1 text-xs tabular-nums ${diff === 0 ? "opacity-50" : diff > 0 ? "text-[#9fc7b3]" : "text-[#e3a593]"}`}>
            {diff === 0 ? "与当前一致" : `${diff > 0 ? "+" : "-"}¥${splitCnyMinor(Math.abs(diff)).integer} 较当前`}
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
