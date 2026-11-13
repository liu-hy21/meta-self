"use client";

import { useState } from "react";

import { FinanceSensitiveAmount } from "@/components/finance/finance-visibility";
import { splitCnyMinor, type AssetAllocationKey, type AssetAllocationSlice } from "@/lib/finance-holdings";

const SIZE = 200;
const STROKE = 22;
// Leave room for the thicker active arc inside the SVG viewport.
const RADIUS = (SIZE - (STROKE + 4)) / 2 - 1;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

type AllocationStatus = "ok" | "below" | "over";

type FinanceAssetAllocationPieProps = {
  slices: AssetAllocationSlice[];
  sliceStates?: Partial<Record<AssetAllocationKey, AllocationStatus>>;
  showStatus?: boolean;
  activeKey?: AssetAllocationKey | null;
  onActiveChange?: (key: AssetAllocationKey | null) => void;
};

export function FinanceAssetAllocationPie({
  slices,
  sliceStates,
  showStatus = false,
  activeKey,
  onActiveChange,
}: FinanceAssetAllocationPieProps) {
  const [internalSelected, setInternalSelected] = useState<AssetAllocationKey | null>(null);
  const [hovered, setHovered] = useState<AssetAllocationKey | null>(null);
  const selected = activeKey === undefined ? internalSelected : activeKey;
  const active = hovered ?? selected;
  const total = slices.reduce((sum, s) => sum + s.cnyMinor, 0);
  const visible = slices.filter((s) => s.cnyMinor > 0);
  const focused = slices.find((s) => s.key === active) ?? null;

  const statusLabel = (status: AllocationStatus | undefined) =>
    status === "over" ? "超限" : status === "below" ? "不足" : status === "ok" ? "正常" : null;

  const choose = (key: AssetAllocationKey) => {
    const next = selected === key ? null : key;
    if (activeKey === undefined) setInternalSelected(next);
    onActiveChange?.(next);
  };

  const arcs = visible.map((slice, index) => {
    const offset = visible.slice(0, index).reduce((sum, item) => sum + (item.cnyMinor / total) * CIRCUMFERENCE, 0);
    const length = (slice.cnyMinor / total) * CIRCUMFERENCE;
    const arc = { slice, offset, length: Math.max(length - (visible.length > 1 ? GAP : 0), 0.5) };
    return arc;
  });

  const centerValue = focused ? focused.cnyMinor : total;
  const { integer } = splitCnyMinor(centerValue);
  const centerPct = focused && total > 0 ? `${((focused.cnyMinor / total) * 100).toFixed(1)}%` : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center lg:flex-col xl:mx-auto xl:w-full xl:max-w-[44rem] xl:flex-row xl:gap-8">
      <div className="relative h-44 w-44 shrink-0 xl:h-36 xl:w-36 2xl:h-44 2xl:w-44">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" role="group" aria-label="资产结构环形图">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--ink)"
            strokeOpacity={0.06}
            strokeWidth={STROKE}
          />
          {arcs.map(({ slice, offset: o, length }) => {
            const dim = active != null && active !== slice.key;
            const status = sliceStates?.[slice.key];
            const label = statusLabel(status);
            return (
              <circle
                key={slice.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={active === slice.key ? STROKE + 4 : STROKE}
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={-o}
                strokeLinecap="butt"
                className="cursor-pointer transition-[opacity,stroke-width] duration-200 focus:outline-none"
                opacity={dim ? 0.28 : 1}
                tabIndex={0}
                role="button"
                aria-label={label ? `${slice.label}，${label}` : slice.label}
                onPointerEnter={() => setHovered(slice.key)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(slice.key)}
                onBlur={() => setHovered(null)}
                onClick={() => choose(slice.key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(slice.key);
                  }
                }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] tracking-[0.2em] text-[var(--muted)]">{focused ? focused.label : "总资产"}</span>
          <FinanceSensitiveAmount className="mt-1 text-lg font-semibold tabular-nums text-[var(--ink)]">¥{integer}</FinanceSensitiveAmount>
          {centerPct ? <span className="text-xs tabular-nums text-[var(--gold-deep)]">{centerPct}</span> : null}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {slices.map((slice) => {
          const pct = total > 0 ? (slice.cnyMinor / total) * 100 : 0;
          const isActive = active === slice.key;
          const status = sliceStates?.[slice.key];
          const label = statusLabel(status);
          return (
            <li key={slice.key}>
              <button
                type="button"
                onClick={() => choose(slice.key)}
                onPointerEnter={() => setHovered(slice.key)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(slice.key)}
                onBlur={() => setHovered(null)}
                aria-pressed={selected === slice.key}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-[var(--ink)]/[0.05]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
                    <span className="truncate text-[var(--ink)]">{slice.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 tabular-nums text-[var(--muted)]">
                    {pct.toFixed(1)}%
                    {showStatus && label ? (
                      <span className={status === "ok" ? "text-[#1f7a4d]" : "text-[#b42318]"}>
                        {label}
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--ink)]/[0.06]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: slice.color }}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] tabular-nums text-[var(--muted)]">
                  <FinanceSensitiveAmount>¥{splitCnyMinor(slice.cnyMinor).integer}</FinanceSensitiveAmount>
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
