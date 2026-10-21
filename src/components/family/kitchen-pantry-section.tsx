import Link from "next/link";

import { KitchenActionForm, type KitchenFormAction } from "@/components/family/kitchen-action-form";
import { KitchenPantryFields } from "@/components/family/kitchen-pantry-fields";
import { KitchenPantryList, type KitchenPantryListItem } from "@/components/family/kitchen-pantry-list";
import { SaveButton } from "@/components/body/save-button";
import { backClass, submitClass } from "@/components/ui/form-shell";
import {
  kitchenModuleIdPrefix,
  kitchenModuleWriteQuery,
  kitchenPageQuery,
  type KitchenModule,
  type KitchenViewMode,
} from "@/lib/kitchen";

type PantryItem = KitchenPantryListItem;

export function KitchenPantrySection({
  title,
  module,
  mode,
  items,
  editing,
  write,
  emptyHint,
  deleteLabel,
  createAction,
  updateAction,
  deleteAction,
}: {
  title: string;
  module: KitchenModule;
  mode: KitchenViewMode;
  items: PantryItem[];
  editing: PantryItem | null;
  write: boolean;
  emptyHint: string;
  deleteLabel: string;
  createAction: KitchenFormAction;
  updateAction: KitchenFormAction;
  deleteAction: KitchenFormAction;
}) {
  const recordMode = mode === "record";
  const showCreateForm = recordMode && !editing && (write || items.length === 0);
  const showEditForm = editing != null;
  const showList = !showCreateForm && !showEditForm;

  const listHref = `/library/family/kitchen${kitchenPageQuery({ mode })}`;
  const writeHref = `/library/family/kitchen${kitchenPageQuery({ mode: "record", ...kitchenModuleWriteQuery(module) })}`;
  const idPrefix = kitchenModuleIdPrefix(module);

  return (
    <section className="q-col min-w-0 w-full max-w-sm p-4 lg:max-w-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="q-col-title">{title}</h3>
        {showList && recordMode ? (
          <Link href={writeHref} scroll={false} className={submitClass()}>
            娣诲姞
          </Link>
        ) : null}
      </div>

      {showCreateForm ? (
        <KitchenActionForm action={createAction} className="space-y-3">
          <KitchenPantryFields
            idPrefix={idPrefix}
            name=""
            usageFrequency="MEDIUM"
            description=""
          />
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
          <KitchenPantryFields
            idPrefix={idPrefix}
            id={editing.id}
            name={editing.name}
            usageFrequency={editing.usageFrequency}
            description={editing.description ?? ""}
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
        <KitchenPantryList module={module} mode={mode} items={items} emptyHint={emptyHint} showEdit={recordMode} />
      ) : null}
    </section>
  );
}
