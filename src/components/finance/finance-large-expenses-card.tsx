"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FinanceLargeExpense } from "@prisma/client";

import { createFinanceLargeExpense, updateFinanceLargeExpense } from "@/app/actions/data";
import { financeCardPadding, financeDarkCard } from "@/components/finance/finance-ui-tokens";
import { FinanceDropdown } from "@/components/finance/finance-dropdown";
import { calendarDateInTimezone } from "@/lib/dates";

function formatDate(date: Date) {
  return date.toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatYuan(minor: number) {
  return `¥${(minor / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fieldClassName() {
  return "mt-1 h-10 w-full rounded-xl border border-[var(--panel)]/20 bg-[var(--panel)]/10 px-3 text-sm text-[var(--panel)] outline-none placeholder:text-[var(--panel)]/40 focus:border-[var(--gold)]";
}

type LargeExpenseType = FinanceLargeExpense["type"];

const largeExpenseTypeLabels: Record<LargeExpenseType, string> = {
  TRAVEL: "旅游",
  ITEM: "物件",
  OUTFIT: "穿搭",
  DATE: "约会",
  MEDICAL: "医疗",
  DAILY: "基本日常",
};

const largeExpenseTypeOptions: Array<{ value: LargeExpenseType; label: string }> = [
  { value: "TRAVEL", label: "旅游" },
  { value: "ITEM", label: "物件" },
  { value: "OUTFIT", label: "穿搭" },
  { value: "DATE", label: "约会" },
  { value: "MEDICAL", label: "医疗" },
  { value: "DAILY", label: "基本日常" },
];

const largeExpenseTypeColors: Record<LargeExpenseType, string> = {
  TRAVEL: "#2F80ED",
  ITEM: "#C62828",
  OUTFIT: "#8E6C88",
  DATE: "#EF6C00",
  MEDICAL: "#2E7D32",
  DAILY: "#607D8B",
};

const largeExpenseTypeOrder: LargeExpenseType[] = ["TRAVEL", "ITEM", "OUTFIT", "DATE", "MEDICAL", "DAILY"];

function FinanceLargeExpenseTypePie({
  year,
  totalMinor,
  typeTotals,
}: {
  year: number;
  totalMinor: number;
  typeTotals: Array<{ type: LargeExpenseType; amountMinor: number }>;
}) {
  const [activeType, setActiveType] = useState<LargeExpenseType | null>(null);
  const visibleTotals = largeExpenseTypeOrder
    .map((type) => ({
      type,
      amountMinor: typeTotals.find((item) => item.type === type)?.amountMinor ?? 0,
    }))
    .filter((item) => item.amountMinor > 0);
  const total = totalMinor > 0 ? totalMinor : visibleTotals.reduce((sum, item) => sum + item.amountMinor, 0);
  const size = 200;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcs = visibleTotals.reduce<Array<{ type: LargeExpenseType; amountMinor: number; offset: number; length: number }>>(
    (items, item) => {
      const length = total > 0 ? (item.amountMinor / total) * circumference : 0;
      const previous = items.at(-1);
      items.push({ ...item, offset: previous ? previous.offset + previous.length : 0, length });
      return items;
    },
    [],
  );
  const focused = visibleTotals.find((item) => item.type === activeType);

  function toggleType(type: LargeExpenseType) {
    setActiveType((current) => (current === type ? null : type));
  }

  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0 self-center sm:self-auto">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" role="group" aria-label={`${year}年大额消费类型分布`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--panel)" strokeOpacity={0.08} strokeWidth={stroke} />
          {arcs.map((arc) => {
            const isActive = activeType === arc.type;
            const dimmed = activeType != null && !isActive;
            const gap = arcs.length > 1 ? 3 : 0;
            const percentage = total > 0 ? ((arc.amountMinor / total) * 100).toFixed(1) : "0.0";
            return (
              <circle
                key={arc.type}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={largeExpenseTypeColors[arc.type]}
                strokeWidth={isActive ? stroke + 4 : stroke}
                strokeDasharray={`${Math.max(arc.length - gap, 0.5)} ${circumference - Math.max(arc.length - gap, 0.5)}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                opacity={dimmed ? 0.28 : 1}
                className="cursor-pointer transition-[opacity,stroke-width] duration-200 focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${largeExpenseTypeLabels[arc.type]}，${formatYuan(arc.amountMinor)}，${percentage}%`}
                onPointerEnter={() => setActiveType(arc.type)}
                onPointerLeave={() => setActiveType(null)}
                onFocus={() => setActiveType(arc.type)}
                onBlur={() => setActiveType(null)}
                onClick={() => toggleType(arc.type)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleType(arc.type);
                  }
                }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-[var(--panel)]/60">{focused ? largeExpenseTypeLabels[focused.type] : `${year}年`}</span>
          <span className="mt-1 text-lg font-semibold tabular-nums text-[var(--panel)]">{formatYuan(focused?.amountMinor ?? total)}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-[var(--panel)]">类型分布</h3>
        <ul className="mt-3 space-y-1">
          {visibleTotals.map((item) => {
            const percentage = total > 0 ? (item.amountMinor / total) * 100 : 0;
            const isActive = activeType === item.type;
            return (
              <li key={item.type}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleType(item.type)}
                  onPointerEnter={() => setActiveType(item.type)}
                  onPointerLeave={() => setActiveType(null)}
                  onFocus={() => setActiveType(item.type)}
                  onBlur={() => setActiveType(null)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${isActive ? "bg-[var(--panel)]/10" : "hover:bg-[var(--panel)]/5"}`}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: largeExpenseTypeColors[item.type] }} aria-hidden />
                      <span className="truncate text-[var(--panel)]">{largeExpenseTypeLabels[item.type]}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--panel)]/70">{formatYuan(item.amountMinor)}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--panel)]/10">
                    <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${percentage}%`, backgroundColor: largeExpenseTypeColors[item.type] }} />
                  </div>
                  <p className="mt-1 text-right text-xs tabular-nums text-[var(--panel)]/55">{percentage.toFixed(1)}%</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function FinanceLargeExpensesCard({
  expenses,
  total,
  page,
  pageCount,
  error,
  yearOptions,
  selectedYear,
  selectedYearTotalMinor,
  selectedYearTypeTotals,
}: {
  expenses: FinanceLargeExpense[];
  total: number;
  page: number;
  pageCount: number;
  error?: "required";
  yearOptions: Array<{ year: number; totalMinor: number }>;
  selectedYear: number | null;
  selectedYearTotalMinor: number | null;
  selectedYearTypeTotals: Array<{ type: LargeExpenseType; amountMinor: number }>;
}) {
  const today = calendarDateInTimezone(new Date()).toISOString().slice(0, 10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState<string>("ITEM");
  const [editingType, setEditingType] = useState<string>("ITEM");
  const router = useRouter();

  function handleYearChange(value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("expenseYear", value);
    else url.searchParams.delete("expenseYear");
    url.searchParams.delete("expensePage");
    router.push(`${url.pathname}${url.search}`, { scroll: false });
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams({ expensePage: String(nextPage) });
    if (selectedYear != null) params.set("expenseYear", String(selectedYear));
    return `/finance/profile?${params.toString()}`;
  }

  return (
    <section id="finance-large-expenses-card" className={`${financeDarkCard} ${financeCardPadding} flex h-[640px] flex-col overflow-hidden`} aria-labelledby="finance-large-expenses-title">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--panel)]/15 pb-5">
        <h2 id="finance-large-expenses-title" className="text-base font-semibold text-[var(--panel)]">
          历史大额消费
        </h2>
        <div className="flex items-center gap-3">
          {selectedYear == null ? <span className="text-xs tabular-nums text-[var(--panel)]/55">共 {total} 条</span> : null}
          <FinanceDropdown
            compact label="按年份筛选历史大额消费"
            options={[{ value: "", label: "全部年份" }, ...yearOptions.map((option) => ({ value: String(option.year), label: `${option.year}年` }))]}
            value={selectedYear == null ? "" : String(selectedYear)}
            onChange={handleYearChange}
          />
          {selectedYear == null ? (
            <button
              type="submit"
              form="finance-large-expense-form"
              className="inline-flex h-9 items-center rounded-full bg-[var(--panel)] px-4 text-sm font-medium text-[var(--ink)] transition-transform hover:-translate-y-px"
            >
              新增
            </button>
          ) : null}
        </div>
      </div>

      {selectedYear != null && selectedYearTotalMinor != null ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--panel)]/15 pb-4">
            <span className="text-sm text-[var(--panel)]/65">{selectedYear}年大额消费</span>
            <span className="text-2xl font-semibold tabular-nums text-[var(--panel)]">{formatYuan(selectedYearTotalMinor)}</span>
          </div>
          <FinanceLargeExpenseTypePie year={selectedYear} totalMinor={selectedYearTotalMinor} typeTotals={selectedYearTypeTotals} />
        </div>
      ) : (
        <>
          <form id="finance-large-expense-form" action={createFinanceLargeExpense} className="mt-6">
            <input type="hidden" name="expenseYear" value="" />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1.35fr)_7rem_7.5rem_minmax(0,1fr)]">
              <label className="text-xs text-[var(--panel)]/65">
                项目
                <input className={fieldClassName()} name="title" type="text" maxLength={120} placeholder="例如：购车" required />
              </label>
              <label className="text-xs text-[var(--panel)]/65">
                金额（元）
                <input className={fieldClassName()} name="amountYuan" type="number" min="0.01" step="0.01" inputMode="decimal" required />
              </label>
              <label className="text-xs text-[var(--panel)]/65">
                日期
                <input className={fieldClassName()} name="occurredOn" type="date" defaultValue={today} required />
              </label>
              <label className="text-xs text-[var(--panel)]/65">
                类型
                <FinanceDropdown name="type" label="新增消费类型" options={largeExpenseTypeOptions} value={newType} onChange={setNewType} />
              </label>
            </div>
            {error ? <p className="mt-4 text-xs text-[#f0aa99]">请填写完整信息</p> : null}
          </form>

          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            {expenses.length > 0 ? (
              <ul className="-mx-6 min-h-0 flex-1 overflow-y-auto border-y border-[var(--panel)]/10">
                {expenses.map((expense) => (
                  <li key={expense.id} className="border-b border-[var(--panel)]/10 px-6 py-4">
                    {editingId === expense.id ? (
                      <form action={updateFinanceLargeExpense} className="grid gap-3 sm:grid-cols-[minmax(0,1.35fr)_7rem_7.5rem_minmax(0,1fr)_auto] sm:items-end">
                        <input type="hidden" name="id" value={expense.id} />
                        <input type="hidden" name="expensePage" value={page} />
                        <input type="hidden" name="expenseYear" value="" />
                        <label className="text-xs text-[var(--panel)]/65">
                          项目
                          <input className={fieldClassName()} name="title" type="text" maxLength={120} defaultValue={expense.title} required />
                        </label>
                        <label className="text-xs text-[var(--panel)]/65">
                          金额（元）
                          <input
                            className={fieldClassName()}
                            name="amountYuan"
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            defaultValue={(expense.amountMinor / 100).toFixed(2)}
                            required
                          />
                        </label>
                        <label className="text-xs text-[var(--panel)]/65">
                          日期
                          <input className={fieldClassName()} name="occurredOn" type="date" defaultValue={expense.occurredOn.toISOString().slice(0, 10)} required />
                        </label>
                        <label className="text-xs text-[var(--panel)]/65">
                          类型
                          <FinanceDropdown name="type" label="编辑消费类型" options={largeExpenseTypeOptions} value={editingType} onChange={setEditingType} />
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            aria-label={`保存${expense.title}`}
                            title="保存"
                            className="grid size-9 place-items-center rounded-full border border-[var(--panel)]/25 text-[var(--panel)] transition-colors hover:bg-[var(--panel)]/10"
                          >
                            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="m4 10.2 3.7 3.7L16 5.7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={`取消编辑${expense.title}`}
                            title="取消"
                            onClick={() => setEditingId(null)}
                            className="grid size-9 place-items-center rounded-full border border-[var(--panel)]/15 text-[var(--panel)]/65 transition-colors hover:bg-[var(--panel)]/10 hover:text-[var(--panel)]"
                          >
                            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                              <path d="m5 5 10 10M15 5 5 15" />
                            </svg>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[var(--panel)]">{expense.title}</p>
                          <p className="mt-1 truncate text-xs text-[var(--panel)]/55">
                            {formatDate(expense.occurredOn)} · {largeExpenseTypeLabels[expense.type]}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums text-[var(--panel)]">{formatYuan(expense.amountMinor)}</span>
                          <button
                            type="button"
                            aria-label={`编辑${expense.title}`}
                            title="编辑"
                            onClick={() => { setEditingType(expense.type); setEditingId(expense.id); }}
                            className="grid size-8 place-items-center rounded-full border border-[var(--panel)]/15 text-[var(--panel)]/65 transition-colors hover:bg-[var(--panel)]/10 hover:text-[var(--panel)]"
                          >
                            <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="m13.8 3.2 3 3M4 16l.6-3.3L13.8 3.5a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L7.3 15.4 4 16Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center border-y border-dashed border-[var(--panel)]/15 text-center text-sm text-[var(--panel)]/55">暂无记录</div>
            )}
          </div>

          {pageCount > 1 ? (
            <nav className="mt-5 flex items-center justify-between gap-3 text-xs text-[var(--panel)]/65" aria-label="历史大额消费分页">
              {page > 1 ? (
                <Link className="hover:text-[var(--panel)]" href={pageHref(page - 1)} scroll={false}>
                  上一页
                </Link>
              ) : (
                <span />
              )}
              <span className="tabular-nums">
                {page} / {pageCount}
              </span>
              {page < pageCount ? (
                <Link className="hover:text-[var(--panel)]" href={pageHref(page + 1)} scroll={false}>
                  下一页
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
