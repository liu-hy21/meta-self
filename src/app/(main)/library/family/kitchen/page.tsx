import {
  createKitchenCleaning,
  createKitchenDish,
  createKitchenMeat,
  createKitchenSeasoning,
  createKitchenVegetable,
  deleteKitchenCleaning,
  deleteKitchenDish,
  deleteKitchenMeat,
  deleteKitchenSeasoning,
  deleteKitchenVegetable,
  updateKitchenCleaning,
  updateKitchenDish,
  updateKitchenMeat,
  updateKitchenSeasoning,
  updateKitchenVegetable,
} from "@/app/actions/data";
import { KitchenCleaningColumn } from "@/components/family/kitchen-cleaning-column";
import { KitchenDishColumn } from "@/components/family/kitchen-dish-column";
import { KitchenDishLogRailSync } from "@/components/family/kitchen-dish-log-rail-sync";
import { KitchenModeSwitch } from "@/components/family/kitchen-mode-switch";
import { KitchenPantrySection } from "@/components/family/kitchen-pantry-section";
import { cleaningCadences } from "@/lib/kitchen-cleaning";
import { dishDifficulties } from "@/lib/kitchen-dish";
import { parseKitchenSearchParams } from "@/lib/kitchen";
import { prisma } from "@/lib/db";
import { pageWrapKitchen } from "@/components/ui/form-shell";
import { getAppUser } from "@/lib/user";

function PotIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5z" />
      <path d="M2 10h2M20 10h2M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2" />
    </svg>
  );
}

function BasketIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h18l-2 9H5l-2-9z" />
      <path d="M8 10l3-6M16 10l-3-6M9 14v2M15 14v2" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
      <path d="M18 5l-2 2M8 15l-2 2M6 5l2 2M16 15l2 2" />
    </svg>
  );
}

function BlockHead({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="q-block-head">
      <span className="q-badge">{icon}</span>
      <h3 className="q-title-pill">{title}</h3>
      <span className="q-tag ml-auto bg-white">{count} 项</span>
    </div>
  );
}
const threeColGrid =
  "grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]";

export default async function FamilyKitchenPage({
  searchParams,
}: {
  searchParams: Promise<{
    sw?: string;
    se?: string;
    vw?: string;
    ve?: string;
    mw?: string;
    me?: string;
    dw?: string;
    dx?: string;
    clw?: string;
    clx?: string;
    mode?: string;
    write?: string;
    edit?: string;
  }>;
}) {
  const user = await getAppUser();
  const raw = await searchParams;
  const {
    mode,
    seasoningWrite,
    seasoningEdit,
    vegetableWrite,
    vegetableEdit,
    meatWrite,
    meatEdit,
    dishWrite,
    dishEdit,
    cleaningWrite,
    cleaningEdit,
  } = parseKitchenSearchParams(raw);

  const recordMode = mode === "record";

  const [seasonings, vegetables, meats, dishes, cleanings] = await Promise.all([
    prisma.kitchenSeasoning.findMany({
      where: { userId: user.id },
      orderBy: [{ usageFrequency: "asc" }, { name: "asc" }],
    }),
    prisma.kitchenVegetable.findMany({
      where: { userId: user.id },
      orderBy: [{ usageFrequency: "asc" }, { name: "asc" }],
    }),
    prisma.kitchenMeat.findMany({
      where: { userId: user.id },
      orderBy: [{ usageFrequency: "asc" }, { name: "asc" }],
    }),
    prisma.kitchenDish.findMany({
      where: { userId: user.id },
      orderBy: [{ difficulty: "asc" }, { name: "asc" }],
    }),
    prisma.kitchenCleaning.findMany({
      where: { userId: user.id },
      orderBy: [{ cadence: "asc" }, { name: "asc" }],
    }),
  ]);

  const editingSeasoning =
    recordMode && seasoningEdit ? seasonings.find((s) => s.id === seasoningEdit) ?? null : null;
  const editingVegetable =
    recordMode && vegetableEdit ? vegetables.find((v) => v.id === vegetableEdit) ?? null : null;
  const editingMeat = recordMode && meatEdit ? meats.find((m) => m.id === meatEdit) ?? null : null;
  const editingDish = recordMode && dishEdit ? dishes.find((d) => d.id === dishEdit) ?? null : null;
  const editingCleaning =
    recordMode && cleaningEdit ? cleanings.find((c) => c.id === cleaningEdit) ?? null : null;
  const dishUiBusy = recordMode && Boolean(dishEdit || dishWrite);
  const cleaningUiBusy = recordMode && Boolean(cleaningEdit || cleaningWrite);
  const kitchenUiBusy =
    recordMode &&
    Boolean(
      seasoningEdit ||
        seasoningWrite ||
        vegetableEdit ||
        vegetableWrite ||
        meatEdit ||
        meatWrite ||
        dishEdit ||
        dishWrite ||
        cleaningEdit ||
        cleaningWrite,
    );

  const boardMode = !recordMode;

  return (
    <div className={pageWrapKitchen}>
      <KitchenDishLogRailSync boardMode={boardMode} />
      <header className="q-hero flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-7">
        <div className="flex items-center gap-3">
          <span className="q-badge size-12 bg-[#fff6e6]">
            <PotIcon />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#4a3326]">我的小厨房</h2>
            <p className="text-xs text-[#4a3326]/70">{boardMode ? "看板模式 · 点一道菜看做法" : "记录模式 · 随手添加与修改"}</p>
          </div>
        </div>
        {kitchenUiBusy ? null : (
          <div className="flex items-center gap-2 rounded-full border-[3px] border-[#4a3326] bg-white px-3 py-1 shadow-[0_3px_0_#4a3326]">
            <span className="text-xs font-bold text-[#4a3326]">{boardMode ? "看板" : "记录"}</span>
            <KitchenModeSwitch mode={mode} />
          </div>
        )}
      </header>

      <section className="q-block" data-tone="tomato">
        <BlockHead icon={<PotIcon />} title="好吃的菜" count={dishes.length} />
        <div className={`${threeColGrid} p-4`}>
          {dishDifficulties.map((level) => {
            const columnItems = dishes.filter((d) => d.difficulty === level.value);
            const editing = editingDish?.difficulty === level.value ? editingDish : null;
            const write = dishWrite === level.value;

            return (
              <KitchenDishColumn
                key={level.value}
                mode={mode}
                difficulty={level.value}
                items={columnItems}
                editing={editing}
                write={recordMode && write}
                dishUiBusy={dishUiBusy}
                boardMode={boardMode}
                emptyHint={recordMode ? "还没有菜，点右上角添加。" : "还没有菜。"}
                deleteLabel="删除这道菜"
                createAction={createKitchenDish}
                updateAction={updateKitchenDish}
                deleteAction={deleteKitchenDish}
              />
            );
          })}
        </div>
      </section>

      <section className="q-block" data-tone="mint">
        <BlockHead
          icon={<BasketIcon />}
          title="常备食材"
          count={seasonings.length + vegetables.length + meats.length}
        />
        <div className={`${threeColGrid} p-4`}>
          <KitchenPantrySection
            title="调料"
            module="seasoning"
            mode={mode}
            items={seasonings}
            editing={editingSeasoning}
            write={recordMode && seasoningWrite}
            emptyHint={recordMode ? "还没有调料，点右上角添加。" : "还没有调料。"}
            deleteLabel="删除这条调料"
            createAction={createKitchenSeasoning}
            updateAction={updateKitchenSeasoning}
            deleteAction={deleteKitchenSeasoning}
          />
          <KitchenPantrySection
            title="蔬菜"
            module="vegetable"
            mode={mode}
            items={vegetables}
            editing={editingVegetable}
            write={recordMode && vegetableWrite}
            emptyHint={recordMode ? "还没有蔬菜，点右上角添加。" : "还没有蔬菜。"}
            deleteLabel="删除这条蔬菜"
            createAction={createKitchenVegetable}
            updateAction={updateKitchenVegetable}
            deleteAction={deleteKitchenVegetable}
          />
          <KitchenPantrySection
            title="肉"
            module="meat"
            mode={mode}
            items={meats}
            editing={editingMeat}
            write={recordMode && meatWrite}
            emptyHint={recordMode ? "还没有肉，点右上角添加。" : "还没有肉。"}
            deleteLabel="删除这条肉"
            createAction={createKitchenMeat}
            updateAction={updateKitchenMeat}
            deleteAction={deleteKitchenMeat}
          />
        </div>
      </section>

      <section className="q-block" data-tone="sky">
        <BlockHead icon={<SparkleIcon />} title="厨房清洁" count={cleanings.length} />
        <div className={`${threeColGrid} p-4`}>
          {cleaningCadences.map((level) => {
            const columnItems = cleanings.filter((c) => c.cadence === level.value);
            const editing = editingCleaning?.cadence === level.value ? editingCleaning : null;
            const write = cleaningWrite === level.value;

            return (
              <KitchenCleaningColumn
                key={level.value}
                mode={mode}
                cadence={level.value}
                items={columnItems}
                editing={editing}
                write={recordMode && write}
                cleaningUiBusy={cleaningUiBusy}
                emptyHint={recordMode ? "还没有清洁项，点右上角添加。" : "还没有清洁项。"}
                deleteLabel="删除这条清洁项"
                createAction={createKitchenCleaning}
                updateAction={updateKitchenCleaning}
                deleteAction={deleteKitchenCleaning}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
