import Link from "next/link";

import { FinanceAnalysisTabs, type FinanceAnalysisView } from "@/components/finance/finance-analysis-tabs";
import { FinanceAnalysisView as FinanceAnalysisContent } from "@/components/finance/finance-analysis-view";
import { FinanceVisibilityProvider, FinanceVisibilityToggle } from "@/components/finance/finance-visibility";
import { pageWrap } from "@/components/ui/form-shell";

const validViews: FinanceAnalysisView[] = ["signals", "metrics", "ai"];

export default async function FinanceAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: requestedView } = await searchParams;
  const view = validViews.includes(requestedView as FinanceAnalysisView) ? requestedView as FinanceAnalysisView : "signals";

  return (
    <div className={pageWrap}>
      <FinanceVisibilityProvider>
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-[var(--muted)]">FINANCE · ANALYSIS</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">数据分析</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">从市场信号、资产结构指标和你的五层策略三个角度，逐步形成财商研究工作区。</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/finance/profile"
                className="inline-flex h-9 items-center border-2 border-[var(--ink)] bg-[var(--panel)] px-3 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--gold)]"
              >
                返回资产结构
              </Link>
              <FinanceVisibilityToggle className="border-[var(--ink)]/20 text-[var(--ink)] hover:bg-[var(--ink)]/[0.05]" />
            </div>
          </header>

          <FinanceAnalysisTabs current={view} />
          <FinanceAnalysisContent view={view} />
        </div>
      </FinanceVisibilityProvider>
    </div>
  );
}
