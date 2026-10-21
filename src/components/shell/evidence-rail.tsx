"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { useLogRail } from "@/components/shell/log-rail-context";
import { parseKitchenViewMode } from "@/lib/kitchen";

const railWidth = "w-[320px]";

function railMode(pathname: string) {
  if (pathname.startsWith("/library/family/kitchen")) return "kitchen";
  if (pathname.startsWith("/body/profile")) return "body";
  if (pathname.startsWith("/mind/profile")) return "mind";
  if (pathname.startsWith("/work/profile")) return "work";
  if (pathname.startsWith("/relation/profile")) return "relation";
  return null;
}

const titles: Record<Exclude<ReturnType<typeof railMode>, null>, string> = {
  kitchen: "做法",
  body: "身体日志",
  mind: "心态日志",
  work: "工作日志",
  relation: "关系日志",
};

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
  const { override, setRailSlot } = useLogRail();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = railMode(pathname);
  if (!mode) return null;

  const onKitchenBoard = mode === "kitchen" && parseKitchenViewMode(searchParams.get("mode") ?? undefined) === "board";
  const kitchenDish = mode === "kitchen" && override?.kind === "kitchen-dish" ? override.dish : null;

  return (
    <aside className={`flex ${railWidth} shrink-0 flex-col border-l-4 border-[var(--ink)] bg-[var(--panel)]`}>
      <div className="border-b border-[var(--line)] px-4 py-3">
        <p className="text-sm font-semibold">{titles[mode]}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {mode === "kitchen" ? (
          kitchenDish ? (
            <KitchenDishLogPanel dish={kitchenDish} />
          ) : onKitchenBoard ? (
            <p className="px-1 py-6 text-center text-xs text-[var(--muted)]">点击一道菜，查看原材料与烹饪流程</p>
          ) : (
            <p className="px-1 py-6 text-center text-xs text-[var(--muted)]">记录模式下做法不在这里</p>
          )
        ) : (
          <div ref={setRailSlot} className="min-h-full" />
        )}
      </div>
    </aside>
  );
}
