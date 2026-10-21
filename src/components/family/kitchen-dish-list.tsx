"use client";

import Link from "next/link";

import { useLogRail } from "@/components/shell/log-rail-context";
import type { KitchenViewMode } from "@/lib/kitchen";
import { compareKitchenDishes, dishEditQuery, dishKitchenHref } from "@/lib/kitchen-dish";

export type KitchenDishListItem = {
  id: string;
  name: string;
  ingredients: string | null;
  cookingProcess: string | null;
};

const editLinkClass =
  "inline-flex size-6 shrink-0 items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--gold)]";

function EditIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="square" d="M10.5 2.5 13.5 5.5 5 14H2v-3L10.5 2.5zM9 4l3 3" />
    </svg>
  );
}

export function KitchenDishList({
  mode,
  items,
  emptyHint,
  showEdit = true,
  boardMode = false,
}: {
  mode: KitchenViewMode;
  items: KitchenDishListItem[];
  emptyHint: string;
  showEdit?: boolean;
  boardMode?: boolean;
}) {
  const { selectedKitchenDishId, setKitchenDishDetail } = useLogRail();

  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{emptyHint}</p>;
  }

  const sorted = [...items].sort(compareKitchenDishes);

  return (
    <ul className="space-y-2">
      {sorted.map((item) => {
        const selected = boardMode && selectedKitchenDishId === item.id;

        if (boardMode) {
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  setKitchenDishDetail({
                    id: item.id,
                    name: item.name,
                    ingredients: item.ingredients,
                    cookingProcess: item.cookingProcess,
                  })
                }
                data-selected={selected}
                aria-pressed={selected}
                className="q-item focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{item.name}</span>
                  <span aria-hidden className="text-xs opacity-60">
                    {selected ? "看做法 →" : "›"}
                  </span>
                </span>
              </button>
            </li>
          );
        }

        return (
          <li key={item.id} className="q-item">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.name}</p>
              </div>
              {showEdit ? (
                <Link
                  href={dishKitchenHref({ mode, ...dishEditQuery(item.id) })}
                  scroll={false}
                  className={editLinkClass}
                  aria-label="缂栬緫"
                >
                  <EditIcon />
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
