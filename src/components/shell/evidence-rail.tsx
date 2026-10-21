"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { useLogRail } from "@/components/shell/log-rail-context";
import { parseKitchenViewMode } from "@/lib/kitchen";

function KitchenDishLogPanel({
  dish,
}: {
  dish: { name: string; ingredients: string | null; cookingProcess: string | null };
}) {
  return (
    <div className="space-y-3">
      <div className="pixel-box px-3 py-2.5">
        <p className="text-xs text-[var(--muted)]">好吃的菜</p>
        <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{dish.name}</p>
      </div>
      <div className="pixel-box px-3 py-2.5">
        <p className="text-xs font-medium text-[var(--muted)]">原材料</p>
        {dish.ingredients?.trim() ? (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{dish.ingredients}</p>
        ) : (
          <p className="mt-1 text-sm text-[var(--muted)]">未填写</p>
        )}
      </div>
      <div className="pixel-box px-3 py-2.5">
        <p className="text-xs font-medium text-[var(--muted)]">烹饪流程</p>
        {dish.cookingProcess?.trim() ? (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{dish.cookingProcess}</p>
        ) : (
          <p className="mt-1 text-sm text-[var(--muted)]">未填写</p>
        )}
      </div>
    </div>
  );
}

export function EvidenceRail() {
  const { defaultEvidence, override } = useLogRail();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onKitchenBoard =
    pathname.startsWith("/library/family/kitchen") &&
    parseKitchenViewMode(searchParams.get("mode") ?? undefined) === "board";

  const kitchenDish = override?.kind === "kitchen-dish" ? override.dish : null;

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l-4 border-[var(--ink)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <p className="text-sm font-semibold">日志</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {kitchenDish ? (
          <KitchenDishLogPanel dish={kitchenDish} />
        ) : onKitchenBoard ? (
          <p className="px-1 py-6 text-center text-xs text-[var(--muted)]">点击一道菜，查看原材料与烹饪流程</p>
        ) : defaultEvidence.recent.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-[var(--muted)]">还没有身体流水</p>
        ) : (
          <div className="space-y-2">
            {defaultEvidence.recent.map((row) => (
              <div key={row.label} className="pixel-box px-3 py-2.5">
                <p className="text-xs text-[var(--muted)]">{row.label}</p>
                <p className="mt-1 text-sm text-[var(--gold-deep)]">{row.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
