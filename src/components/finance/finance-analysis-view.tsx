import type { ReactNode } from "react";

import type { FinanceAnalysisView as FinanceAnalysisViewKey } from "@/components/finance/finance-analysis-tabs";

const card = "border border-[var(--ink)]/10 bg-[var(--panel)] shadow-[0_1px_2px_rgba(28,25,23,0.04)]";
const eyebrow = "text-[10px] tracking-[0.2em] text-[var(--muted)]";

function StateBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex border border-[var(--gold-deep)]/30 bg-[var(--gold)]/10 px-2 py-1 text-[10px] text-[var(--gold-deep)]">{children}</span>;
}

function PlaceholderCard({ label, description, state }: { label: string; description: string; state: string }) {
  return (
    <article className={`${card} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">{label}</h3>
        <StateBadge>{state}</StateBadge>
      </div>
      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{description}</p>
      <div className="mt-5 h-2 bg-[var(--ink)]/[0.06]">
        <div className="h-full w-1/3 bg-[var(--gold)]/35" />
      </div>
    </article>
  );
}

function SignalsPanel() {
  return (
    <section className="space-y-5" aria-labelledby="finance-signals-title">
      <div className={`${card} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrow}>MARKET SIGNALS</p>
            <h2 id="finance-signals-title" className="mt-2 text-xl font-semibold text-[var(--ink)]">市场信号分析</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">市场阶段、回撤和趋势确认将在接入真实行情后计算。当前页面只保留分析位置，不展示未经计算的结论。</p>
          </div>
          <StateBadge>待接入</StateBadge>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <PlaceholderCard label="市场阶段" description="依据真实市场信号形成阶段候选。" state="待接入" />
        <PlaceholderCard label="回撤状态" description="记录从阶段高点到当前的回撤变化。" state="待接入" />
        <PlaceholderCard label="趋势确认" description="汇总趋势、波动和风险状态的确认结果。" state="待接入" />
      </div>
    </section>
  );
}

function MetricsPanel() {
  return (
    <section className="space-y-5" aria-labelledby="finance-metrics-title">
      <div className={`${card} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrow}>PORTFOLIO METRICS</p>
            <h2 id="finance-metrics-title" className="mt-2 text-xl font-semibold text-[var(--ink)]">我的资产结构 · 纯指标</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">只展示资产结构本身的指标，不在这一层直接做买入或卖出判断。</p>
          </div>
          <StateBadge>待计算</StateBadge>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <PlaceholderCard label="五层权重" description="高波动、科技防守、消费防守、压舱和安全层的结构占比。" state="待计算" />
        <PlaceholderCard label="QQQ / VOO 差额" description="检查 QQQ 相对 VOO 的策略差额是否满足要求。" state="待计算" />
        <PlaceholderCard label="现金安全垫" description="检查可配置现金与 5 万元流动现金底线。" state="待计算" />
        <PlaceholderCard label="消费防守上限" description="检查 MCD、COKE 合计占比是否超过 10% 上限。" state="待计算" />
        <PlaceholderCard label="黄金占比" description="独立观察黄金在消费防守层中的占比。" state="待计算" />
        <PlaceholderCard label="目标偏差" description="对照五层配比研究中的阶段目标记录偏差。" state="待计算" />
      </div>
    </section>
  );
}

function AiPanel() {
  return (
    <section className="space-y-5" aria-labelledby="finance-ai-title">
      <div className={`${card} p-6 sm:p-7`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={eyebrow}>AI RESEARCH NOTE</p>
            <h2 id="finance-ai-title" className="mt-2 text-xl font-semibold text-[var(--ink)]">AI 分析</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">未来由 AI 综合当前市场信号、资产纯指标和你的五层策略，形成带依据的研究报告。</p>
          </div>
          <StateBadge>AI 报告待生成</StateBadge>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className={`${card} p-6`} aria-labelledby="finance-ai-sources-title">
          <p className={eyebrow}>REPORT INPUTS</p>
          <h3 id="finance-ai-sources-title" className="mt-2 text-base font-semibold text-[var(--ink)]">未来分析输入</h3>
          <ul className="mt-5 divide-y divide-[var(--ink)]/[0.08] text-sm">
            {[
              "真实当前市场信号",
              "我的资产结构纯指标",
              "五层资产配比与市场阶段研究",
            ].map((source) => (
              <li key={source} className="flex items-center justify-between gap-4 py-3">
                <span>{source}</span>
                <span className="text-[10px] text-[var(--muted)]">待接入</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={`${card} min-h-64 p-6`} aria-labelledby="finance-ai-report-title">
          <p className={eyebrow}>REPORT</p>
          <h3 id="finance-ai-report-title" className="mt-2 text-base font-semibold text-[var(--ink)]">分析报告</h3>
          <div className="mt-6 border border-dashed border-[var(--ink)]/20 p-5 text-sm leading-7 text-[var(--muted)]">
            AI 报告待生成。接入真实数据后，这里将展示市场阶段、资产结构和五层策略之间的综合判断，并保留依据来源。
          </div>
        </section>
      </div>
    </section>
  );
}

export function FinanceAnalysisView({ view }: { view: FinanceAnalysisViewKey }) {
  if (view === "metrics") return <MetricsPanel />;
  if (view === "ai") return <AiPanel />;
  return <SignalsPanel />;
}
