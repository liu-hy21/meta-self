import { redirect } from "next/navigation";
import type { FinanceLargeExpense } from "@prisma/client";

import { FinanceAssetsSection } from "@/components/finance/finance-assets-section";
import { pageWrap } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { FINANCE_LARGE_EXPENSES_PAGE_SIZE } from "@/lib/finance-large-expenses";
import { getAppUser } from "@/lib/user";

export default async function FinanceProfilePage({
  searchParams,
}: {
    searchParams: Promise<{
      edit?: string;
      tab?: string;
      trip?: string;
      add?: string;
      assetsError?: string;
      assetsNotice?: string;
      asset?: string;
      expensePage?: string;
      expenseYear?: string;
      largeExpenseError?: string;
    }>;
}) {
  const user = await getAppUser();
  const [{ edit, tab, trip, add, assetsError, assetsNotice, asset, expensePage, expenseYear, largeExpenseError }, holdings, holdingLogs, assetSnapshots, largeExpenseYearRows] = await Promise.all([
    searchParams,
    prisma.financeHolding.findMany({ where: { userId: user.id } }),
    prisma.financeHoldingLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.financeAssetSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { asOfDate: "asc" },
      select: { asOfDate: true, totalCnyMinor: true },
    }),
    prisma.financeLargeExpense.findMany({
      where: { userId: user.id },
      orderBy: { occurredOn: "desc" },
      select: { occurredOn: true, amountMinor: true, type: true },
    }),
  ]);

  const yearTotals = new Map<number, number>();
  const yearTypeTotals = new Map<number, Map<FinanceLargeExpense["type"], number>>();
  for (const row of largeExpenseYearRows) {
    const year = row.occurredOn.getUTCFullYear();
    yearTotals.set(year, (yearTotals.get(year) ?? 0) + row.amountMinor);
    const typeTotals = yearTypeTotals.get(year) ?? new Map<FinanceLargeExpense["type"], number>();
    typeTotals.set(row.type, (typeTotals.get(row.type) ?? 0) + row.amountMinor);
    yearTypeTotals.set(year, typeTotals);
  }
  const expenseYears = [...yearTotals.keys()].sort((a, b) => b - a);
  const requestedExpenseYear = Number.parseInt(expenseYear ?? "", 10);
  const selectedExpenseYear = expenseYears.includes(requestedExpenseYear) ? requestedExpenseYear : null;
  const expenseWhere = {
    userId: user.id,
    ...(selectedExpenseYear != null
      ? {
          occurredOn: {
            gte: new Date(Date.UTC(selectedExpenseYear, 0, 1)),
            lt: new Date(Date.UTC(selectedExpenseYear + 1, 0, 1)),
          },
        }
      : {}),
  };
  const largeExpenseTotal = await prisma.financeLargeExpense.count({ where: expenseWhere });
  const expensePageCount = Math.max(1, Math.ceil(largeExpenseTotal / FINANCE_LARGE_EXPENSES_PAGE_SIZE));
  const requestedExpensePage = Math.max(1, Number.parseInt(expensePage ?? "1", 10) || 1);
  const currentExpensePage = Math.min(requestedExpensePage, expensePageCount);
  const selectedYearTypeTotals = selectedExpenseYear == null
    ? []
    : [...(yearTypeTotals.get(selectedExpenseYear) ?? new Map<FinanceLargeExpense["type"], number>())].map(([type, amountMinor]) => ({
        type,
        amountMinor,
      }));
  const largeExpenses = await prisma.financeLargeExpense.findMany({
    where: expenseWhere,
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    skip: (currentExpensePage - 1) * FINANCE_LARGE_EXPENSES_PAGE_SIZE,
    take: FINANCE_LARGE_EXPENSES_PAGE_SIZE,
  });

  if (tab === "play") {
    const query = new URLSearchParams();
    if (edit) query.set("edit", edit);
    if (trip) query.set("trip", trip);
    if (add) query.set("add", add);
    const suffix = query.toString();
    redirect(suffix ? `/play?${suffix}` : "/play");
  }

  const assetsFormError =
    assetsError === "required" || assetsError === "invalid" || assetsError === "price-unavailable" ? assetsError : undefined;
  const assetsNoticeValue = assetsNotice === "stale-price" ? assetsNotice : undefined;
  const largeExpenseErrorValue = largeExpenseError === "required" ? largeExpenseError : undefined;

  return (
    <div className={pageWrap}>
      <FinanceAssetsSection
        holdings={holdings}
        logs={holdingLogs}
        trendPoints={assetSnapshots.map((s) => ({
          date: s.asOfDate.toISOString(),
          totalCnyMinor: s.totalCnyMinor,
        }))}
        editing={edit === "1"}
        assetsError={assetsFormError}
        assetsNotice={assetsNoticeValue}
        assetsNoticeAsset={asset}
        largeExpenses={largeExpenses}
        largeExpenseTotal={largeExpenseTotal}
        largeExpensePage={currentExpensePage}
        largeExpensePageCount={expensePageCount}
        largeExpenseError={largeExpenseErrorValue}
        yearOptions={expenseYears.map((year) => ({ year, totalMinor: yearTotals.get(year) ?? 0 }))}
        selectedYear={selectedExpenseYear}
        selectedYearTotalMinor={selectedExpenseYear == null ? null : yearTotals.get(selectedExpenseYear) ?? 0}
        selectedYearTypeTotals={selectedYearTypeTotals}
      />
    </div>
  );
}
