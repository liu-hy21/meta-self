import Link from "next/link";
import type { SeasoningUsageFrequency } from "@prisma/client";

import {
  compareKitchenPantryItems,
  kitchenModuleEditQuery,
  kitchenPageQuery,
  kitchenUsageFrequencyLabel,
  type KitchenModule,
  type KitchenViewMode,
} from "@/lib/kitchen";

export type KitchenPantryListItem = {
  id: string;
  name: string;
  usageFrequency: SeasoningUsageFrequency;
  description: string | null;
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

function editHref(module: KitchenModule, id: string, mode: KitchenViewMode) {
  return `/library/family/kitchen${kitchenPageQuery({ mode, ...kitchenModuleEditQuery(module, id) })}`;
}

export function KitchenPantryList({
  module,
  mode,
  items,
  emptyHint,
  showEdit = true,
}: {
  module: KitchenModule;
  mode: KitchenViewMode;
  items: KitchenPantryListItem[];
  emptyHint: string;
  showEdit?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{emptyHint}</p>;
  }

  const sorted = [...items].sort(compareKitchenPantryItems);

  return (
    <ul className="space-y-2">
      {sorted.map((item) => (
        <li key={item.id} className="q-item">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{item.name}</p>
                <span className="q-tag">
                  {kitchenUsageFrequencyLabel(item.usageFrequency)}
                </span>
              </div>
              {item.description ? (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--muted)]">{item.description}</p>
              ) : null}
            </div>
            {showEdit ? (
              <Link href={editHref(module, item.id, mode)} scroll={false} className={editLinkClass} aria-label="缂栬緫">
                <EditIcon />
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
