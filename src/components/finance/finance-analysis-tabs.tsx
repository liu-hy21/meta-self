import Link from "next/link";

export type FinanceAnalysisView = "signals" | "metrics" | "ai";

const views: { key: FinanceAnalysisView; number: string; label: string }[] = [
  { key: "signals", number: "01", label: "市场信号分析" },
  { key: "metrics", number: "02", label: "资产结构指标" },
  { key: "ai", number: "03", label: "AI 分析" },
];

export function FinanceAnalysisTabs({ current }: { current: FinanceAnalysisView }) {
  return (
    <nav
      aria-label="财商数据分析分区"
      className="flex gap-2 overflow-x-auto border-b-2 border-[var(--ink)]/15 pb-1"
    >
      {views.map((view) => {
        const active = current === view.key;
        return (
          <Link
            key={view.key}
            href={`/finance/analysis?view=${view.key}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 border-2 px-3 py-2 text-sm transition-colors ${
              active
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--panel)] shadow-[3px_3px_0_var(--gold)]"
                : "border-transparent text-[var(--muted)] hover:border-[var(--ink)]/20 hover:bg-[var(--panel)]"
            }`}
          >
            <span className={`text-[10px] tracking-[0.18em] ${active ? "text-[var(--gold)]" : "text-[var(--gold-deep)]"}`}>
              {view.number}
            </span>
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
