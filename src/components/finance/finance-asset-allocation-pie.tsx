"use client";

import { useState } from "react";

import { splitCnyMinor, type AssetAllocationSlice } from "@/lib/finance-holdings";

const SIZE = 200;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

export function FinanceAssetAllocationPie({ slices }: { slices: AssetAllocationSlice[] }) {
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.cnyMinor, 0);
  const visible = slices.filter((s) => s.cnyMinor > 0);
  const focused = slices.find((s) => s.key === active) ?? null;

  let offset = 0;
  const arcs = visible.map((slice) => {
    const length = (slice.cnyMinor / total) * CIRCUMFERENCE;
    const arc = { slice, offset, length: Math.max(length - (visible.length > 1 ? GAP : 0), 0.5) };
    offset += length;
    return arc;
  });

  const centerValue = focused ? focused.cnyMinor : total;
  const { integer } = splitCnyMinor(centerValue);
  const centerPct = focused && total > 0 ? `${((focused.cnyMinor / total) * 100).toFixed(1)}%` : null;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" role="img" aria-label="资产结构环形图">
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
                className="cursor-pointer transition-[opacity,stroke-width] duration-200"
                opacity={dim ? 0.28 : 1}
                onPointerEnter={() => setActive(slice.key)}
                onPointerLeave={() => setActive(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] tracking-[0.2em] text-[var(--muted)]">{focused ? focused.label : "总资产"}</span>
          <span className="mt-1 text-lg font-semibold tabular-nums text-[var(--ink)]">¥{integer}</span>
          {centerPct ? <span className="text-xs tabular-nums text-[var(--gold-deep)]">{centerPct}</span> : null}
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {slices.map((slice) => {
          const pct = total > 0 ? (slice.cnyMinor / total) * 100 : 0;
          const isActive = active === slice.key;
          return (
            <li key={slice.key}>
              <button
                type="button"
                onPointerEnter={() => setActive(slice.key)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(slice.key)}
                onBlur={() => setActive(null)}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-[var(--ink)]/[0.05]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slice.color }} aria-hidden />
                    <span className="text-[var(--ink)]">{slice.label}</span>
                  </span>
                  <span className="tabular-nums text-[var(--muted)]">{pct.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--ink)]/[0.06]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, backgroundColor: slice.color }}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] tabular-nums text-[var(--muted)]">
                  ¥{splitCnyMinor(slice.cnyMinor).integer}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
