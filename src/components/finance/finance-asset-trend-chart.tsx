"use client";

import { useId, useState } from "react";

import { splitCnyMinor } from "@/lib/finance-holdings";

export type AssetTrendPoint = {
  date: string;
  totalCnyMinor: number;
};

const W = 760;
const H = 260;
const PAD = { left: 8, right: 8, top: 24, bottom: 32 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

const RANGES = [
  { key: "30", label: "30天", days: 30 },
  { key: "90", label: "90天", days: 90 },
  { key: "365", label: "1年", days: 365 },
  { key: "all", label: "全部", days: null },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const DAY_MS = 86_400_000;

function axisDate(iso: string) {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${m}/${d}`;
}

function fullDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function compactYuan(yuan: number) {
  if (Math.abs(yuan) >= 100_000_000) return `${(yuan / 100_000_000).toFixed(2)}亿`;
  if (Math.abs(yuan) >= 10_000) return `${(yuan / 10_000).toFixed(1)}万`;
  return yuan.toFixed(0);
}

/** Fritsch–Carlson 单调三次插值，避免平滑曲线越过真实数据点 */
function monotonePath(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return "";
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) slopes.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const tangents = new Array<number>(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    tangents[i] = slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  }
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (xs[i + 1] - xs[i]) / 3;
    d += ` C ${xs[i] + dx} ${ys[i] + tangents[i] * dx}, ${xs[i + 1] - dx} ${ys[i + 1] - tangents[i + 1] * dx}, ${xs[i + 1]} ${ys[i + 1]}`;
  }
  return d;
}

export function FinanceAssetTrendChart({ points }: { points: AssetTrendPoint[] }) {
  const gradientId = useId();
  const [range, setRange] = useState<RangeKey>("all");
  const [hover, setHover] = useState<number | null>(null);

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const latestTime = sorted.length > 0 ? new Date(sorted[sorted.length - 1].date).getTime() : 0;
  const days = RANGES.find((r) => r.key === range)?.days ?? null;
  const ranged = days == null ? sorted : sorted.filter((p) => latestTime - new Date(p.date).getTime() <= days * DAY_MS);
  const data = ranged.length > 0 ? ranged : sorted;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-[var(--muted)]">TREND</p>
        <h3 className="mt-1 text-base font-semibold text-[var(--ink)]">资产走势</h3>
      </div>
      <div className="inline-flex rounded-full bg-[var(--ink)]/[0.05] p-1 text-xs">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => {
              setRange(r.key);
              setHover(null);
            }}
            aria-pressed={range === r.key}
            className={`rounded-full px-3 py-1 transition-colors ${
              range === r.key ? "bg-[var(--panel)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[var(--ink)]/15 text-sm text-[var(--muted)]">
          完整保存一次资产后，这里会按日期记录快照并绘制走势
        </div>
      </div>
    );
  }

  const values = data.map((p) => p.totalCnyMinor / 100);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || Math.max(max * 0.1, 1);
  const hi = max + span * 0.2;
  const lo = Math.max(0, min - span * 0.2);

  const xAt = (i: number) => (data.length === 1 ? PAD.left + INNER_W / 2 : PAD.left + (i / (data.length - 1)) * INNER_W);
  const yAt = (yuan: number) => PAD.top + INNER_H - ((yuan - lo) / (hi - lo || 1)) * INNER_H;

  const xs = data.map((_, i) => xAt(i));
  const ys = values.map(yAt);
  const line = monotonePath(xs, ys);
  const area = line ? `${line} L ${xs[xs.length - 1]} ${PAD.top + INNER_H} L ${xs[0]} ${PAD.top + INNER_H} Z` : "";

  const gridValues = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  const first = data[0].totalCnyMinor;
  const last = data[data.length - 1].totalCnyMinor;
  const change = last - first;
  const changePct = first > 0 ? (change / first) * 100 : 0;
  const up = change >= 0;

  const hovered = hover != null ? data[hover] : null;

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    for (let i = 1; i < xs.length; i++) {
      if (Math.abs(xs[i] - x) < Math.abs(xs[nearest] - x)) nearest = i;
    }
    setHover(nearest);
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-sm text-[var(--muted)]">
          {fullDate(data[0].date)} — {fullDate(data[data.length - 1].date)}
        </span>
        {data.length > 1 ? (
          <span className={`text-sm font-medium tabular-nums ${up ? "text-[#4d7a66]" : "text-[#b3644d]"}`}>
            {up ? "▲" : "▼"} ¥{splitCnyMinor(Math.abs(change)).integer}（{up ? "+" : "-"}
            {Math.abs(changePct).toFixed(2)}%）
          </span>
        ) : null}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label="资产随日期变化的走势图"
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c29a5b" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#c29a5b" stopOpacity={0} />
            </linearGradient>
          </defs>

          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yAt(v)}
                y2={yAt(v)}
                stroke="var(--ink)"
                strokeOpacity={0.07}
                strokeDasharray="3 5"
              />
              <text x={W - PAD.right} y={yAt(v) - 6} textAnchor="end" className="fill-[var(--muted)] text-[10px]">
                {compactYuan(v)}
              </text>
            </g>
          ))}

          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {line ? (
            <path d={line} fill="none" stroke="#8c6a45" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}

          {data.map((p, i) =>
            i % labelStep === 0 || i === data.length - 1 ? (
              <text
                key={p.date}
                x={xs[i]}
                y={H - 8}
                textAnchor={data.length === 1 ? "middle" : i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                className="fill-[var(--muted)] text-[10px]"
              >
                {axisDate(p.date)}
              </text>
            ) : null,
          )}

          {data.length === 1 ? <circle cx={xs[0]} cy={ys[0]} r={5} fill="#8c6a45" /> : null}

          {hover != null ? (
            <g>
              <line
                x1={xs[hover]}
                x2={xs[hover]}
                y1={PAD.top}
                y2={PAD.top + INNER_H}
                stroke="var(--ink)"
                strokeOpacity={0.2}
              />
              <circle cx={xs[hover]} cy={ys[hover]} r={9} fill="#c29a5b" fillOpacity={0.2} />
              <circle cx={xs[hover]} cy={ys[hover]} r={4.5} fill="var(--panel)" stroke="#8c6a45" strokeWidth={2} />
            </g>
          ) : null}
        </svg>

        {hovered && hover != null ? (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-[var(--ink)] px-3 py-2 text-xs text-[var(--panel)] shadow-lg"
            style={{ left: `${Math.min(Math.max((xs[hover] / W) * 100, 12), 88)}%` }}
          >
            <p className="opacity-70">{fullDate(hovered.date)}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              ¥{splitCnyMinor(hovered.totalCnyMinor).integer}
              <span className="opacity-60">.{splitCnyMinor(hovered.totalCnyMinor).decimal}</span>
            </p>
          </div>
        ) : null}
      </div>

      {data.length === 1 ? (
        <p className="text-center text-xs text-[var(--muted)]">目前只有一天的快照，不同日期再保存几次就能连成曲线</p>
      ) : null}
    </div>
  );
}
