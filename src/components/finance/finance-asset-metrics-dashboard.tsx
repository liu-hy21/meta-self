"use client";

import { financeCard, financeCardPadding, financeModuleTitle } from "@/components/finance/finance-ui-tokens";

export function FinanceAssetMetricsDashboard() {
  return (
    <section className={financeCard} aria-labelledby="finance-metrics-title">
      <div className={financeCardPadding}>
        <h2 id="finance-metrics-title" className={financeModuleTitle}>指标</h2>
      </div>
    </section>
  );
}
