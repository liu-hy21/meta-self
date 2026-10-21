import Link from "next/link";
import type { DishDifficulty } from "@prisma/client";

import { KitchenActionForm, type KitchenFormAction } from "@/components/family/kitchen-action-form";
import { KitchenDishFields } from "@/components/family/kitchen-dish-fields";
import { KitchenDishList, type KitchenDishListItem } from "@/components/family/kitchen-dish-list";
import { SaveButton } from "@/components/body/save-button";
import { backClass, submitClass } from "@/components/ui/form-shell";
import { kitchenPageQuery, type KitchenViewMode } from "@/lib/kitchen";
import { dishDifficultyColumnTitle, dishWriteQuery } from "@/lib/kitchen-dish";

export function KitchenDishColumn({
  mode,
  difficulty,
  items,
  editing,
  write,
  dishUiBusy,
  boardMode,
  emptyHint,
  deleteLabel,
  createAction,
  updateAction,
  deleteAction,
}: {
  mode: KitchenViewMode;
  difficulty: DishDifficulty;
  items: KitchenDishListItem[];
  editing: (KitchenDishListItem & { difficulty: DishDifficulty }) | null;
  write: boolean;
  dishUiBusy: boolean;
  boardMode: boolean;
  emptyHint: string;
  deleteLabel: string;
  createAction: KitchenFormAction;
  updateAction: KitchenFormAction;
  deleteAction: KitchenFormAction;
}) {
  const recordMode = mode === "record";
  const showCreateForm = recordMode && !editing && (write || (items.length === 0 && !dishUiBusy));
  const showEditForm = editing != null;
  const showList = !showCreateForm && !showEditForm;

  const listHref = `/library/family/kitchen${kitchenPageQuery({ mode })}`;
  const writeHref = `/library/family/kitchen${kitchenPageQuery({ mode: "record", ...dishWriteQuery(difficulty) })}`;
  const idPrefix = `dish-${difficulty.toLowerCase()}`;

  return (
    <section className="q-col min-w-0 w-full max-w-sm p-4 lg:max-w-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="q-col-title">{dishDifficultyColumnTitle(difficulty)}</h4>
        {showList && recordMode ? (
          <Link href={writeHref} scroll={false} className={submitClass()}>
            娣诲姞
          </Link>
        ) : null}
      </div>

      {showCreateForm ? (
        <KitchenActionForm action={createAction} className="space-y-3">
          <KitchenDishFields idPrefix={idPrefix} name="" difficulty={difficulty} ingredients="" cookingProcess="" />
          <div className="flex flex-wrap gap-2">
            <SaveButton />
            {items.length > 0 ? (
              <Link href={listHref} scroll={false} className={backClass}>
                鍙栨秷
              </Link>
            ) : null}
          </div>
        </KitchenActionForm>
      ) : null}

      {showEditForm && editing ? (
        <KitchenActionForm action={updateAction} className="space-y-3">
          <KitchenDishFields
            idPrefix={idPrefix}
            id={editing.id}
            name={editing.name}
            difficulty={editing.difficulty}
            ingredients={editing.ingredients ?? ""}
            cookingProcess={editing.cookingProcess ?? ""}
            showDifficultySelect
          />
          <div className="flex flex-wrap gap-2">
            <SaveButton />
            <Link href={listHref} scroll={false} className={backClass}>
              杩斿洖
            </Link>
          </div>
        </KitchenActionForm>
      ) : null}

      {showEditForm && editing ? (
        <KitchenActionForm action={deleteAction} className="mt-4 border-t border-dashed border-[var(--muted)] pt-3">
          <input type="hidden" name="id" value={editing.id} />
          <button
            type="submit"
            className="text-xs text-[#b45309] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
          >
            {deleteLabel}
          </button>
        </KitchenActionForm>
      ) : null}

      {showList ? (
        <KitchenDishList
          mode={mode}
          items={items}
          emptyHint={emptyHint}
          showEdit={recordMode}
          boardMode={boardMode}
        />
      ) : null}
    </section>
  );
}
