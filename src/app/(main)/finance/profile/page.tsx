import { redirect } from "next/navigation";

import { FinanceAssetsSection } from "@/components/finance/finance-assets-section";
import { pageWrap } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export default async function FinanceProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; tab?: string; trip?: string; add?: string; assetsError?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit, tab, trip, add, assetsError }, holdings, holdingLogs, assetSnapshots] = await Promise.all([
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
  ]);

  if (tab === "play") {
    const query = new URLSearchParams();
    if (edit) query.set("edit", edit);
    if (trip) query.set("trip", trip);
    if (add) query.set("add", add);
    const suffix = query.toString();
    redirect(suffix ? `/play?${suffix}` : "/play");
  }

  const assetsFormError = assetsError === "required" || assetsError === "invalid" ? assetsError : undefined;

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
      />
    </div>
  );
}
