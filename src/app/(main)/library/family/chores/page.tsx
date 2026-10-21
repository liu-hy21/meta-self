import Link from "next/link";

import { createChoreLog, updateChoreLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { ChoresLogList } from "@/components/family/chores-log-list";
import { ChoresModeSwitch } from "@/components/family/chores-mode-switch";
import { ChoresWeeklyTodoList } from "@/components/family/chores-weekly-todo-list";
import { choresPageQuery, isWeeklyChoreDone, parseChoresViewMode, type ChoresViewMode } from "@/lib/chores";
import { prisma } from "@/lib/db";
import { pageWrapHome } from "@/components/ui/form-shell";
import { getAppUser } from "@/lib/user";

type Cadence = "DAILY" | "WEEKLY" | "MONTHLY";

const cadenceMeta: Record<Cadence, { label: string; tone: string; caption: string }> = {
  DAILY: { label: "日常", tone: "sun", caption: "每天顺手的小事" },
  WEEKLY: { label: "每周", tone: "mint", caption: "一周来一次" },
  MONTHLY: { label: "每月", tone: "lilac", caption: "月度大扫除" },
};

function HouseIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" fill="#fff6e6" />
      <path d="M10 20v-5h4v5" />
      <path d="M16 6.5V4.5h2V8" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" fill="#ffd27a" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}

function BroomIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 3 12.5 9.5" />
      <path d="M11 8.5 15.5 13l-1.5 1.5c-1 3-3 5.5-6.5 6.5L3 16.5C4 13 6.5 11 9.5 10L11 8.5z" fill="#9fd8b5" />
      <path d="M7 15.5 8.5 17M9.5 13.5l1.5 1.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" fill="#c9b5f0" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

const cadenceIcon: Record<Cadence, React.ReactNode> = {
  DAILY: <SunIcon />,
  WEEKLY: <BroomIcon />,
  MONTHLY: <CalendarIcon />,
};

function CadenceColumn({
  cadence,
  count,
  children,
}: {
  cadence: Cadence;
  count: number;
  children: React.ReactNode;
}) {
  const meta = cadenceMeta[cadence];
  return (
    <section className="q-block flex min-h-0 flex-col" data-tone={meta.tone}>
      <header className="q-block-head justify-between">
        <span className="flex items-center gap-3">
          <span className="q-badge text-[#4a3326]">{cadenceIcon[cadence]}</span>
          <span>
            <span className="q-title-pill block w-fit">{meta.label}</span>
            <span className="mt-1 block pl-1 text-[11px] font-semibold text-[#4a3326]/70">{meta.caption}</span>
          </span>
        </span>
        <span className="q-chip tabular-nums">{count} 项</span>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

function ChoreForm({
  action,
  cadence,
  text,
  id,
  mode,
  title,
  cancelHref,
}: {
  action: (formData: FormData) => Promise<void>;
  cadence: Cadence;
  text: string;
  id?: string;
  mode: ChoresViewMode;
  title: string;
  cancelHref: string;
}) {
  return (
    <section className="q-block" data-tone="sun">
      <header className="q-block-head">
        <span className="q-badge text-[#4a3326]">
          <HouseIcon className="size-5" />
        </span>
        <span className="q-title-pill">{title}</span>
      </header>
      <form action={action} className="grid gap-4 p-4">
        {id ? <input type="hidden" name="id" value={id} /> : null}
        <input type="hidden" name="mode" value={mode} />

        <fieldset>
          <legend className="mb-3 text-sm font-bold text-[#4a3326]">多久做一次？</legend>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(cadenceMeta) as Cadence[]).map((c) => (
              <label key={c} className="q-pill-radio" data-tone={cadenceMeta[c].tone}>
                <input type="radio" name="cadence" value={c} defaultChecked={c === cadence} required />
                <span>
                  {cadenceIcon[c]}
                  {cadenceMeta[c].label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#4a3326]" htmlFor="text">
            做什么
          </label>
          <textarea
            id="text"
            name="text"
            rows={5}
            className="q-field resize-y leading-6"
            required
            defaultValue={text}
            placeholder="比如：给绿萝浇水、换床单、清理冰箱…"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href={cancelHref} className="q-btn" data-variant="ghost">
            取消
          </Link>
          <SaveButton label={id ? "保存修改" : "保存"} className="q-btn" />
        </div>
      </form>
    </section>
  );
}

export default async function FamilyChoresPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string; edit?: string; mode?: string }>;
}) {
  const user = await getAppUser();
  const { write, edit: editId, mode: modeRaw } = await searchParams;
  const mode = parseChoresViewMode(modeRaw);
  const boardMode = mode === "board";

  const logs = await prisma.choreLog.findMany({
    where: { userId: user.id },
    orderBy: [{ doneOn: "desc" }, { createdAt: "desc" }],
    take: 80,
  });

  const editingLog = editId ? logs.find((log) => log.id === editId) ?? null : null;
  const showCreateForm = !editingLog && mode === "record" && (write === "1" || logs.length === 0);
  const showEditForm = editingLog != null;
  const showList = !showCreateForm && !showEditForm;

  const listHref = `/library/family/chores${choresPageQuery({ mode })}`;
  const writeHref = `/library/family/chores${choresPageQuery({ mode, write: "1" })}`;

  const daily = logs.filter((log) => log.cadence === "DAILY").map((l) => ({ id: l.id, text: l.text }));
  const weeklyLogs = logs.filter((log) => log.cadence === "WEEKLY");
  const weekly = weeklyLogs.map((l) => ({ id: l.id, text: l.text }));
  const weeklyTodos = weeklyLogs.map((l) => ({ id: l.id, text: l.text, completed: isWeeklyChoreDone(l.completedAt) }));
  const monthly = logs.filter((log) => log.cadence === "MONTHLY").map((l) => ({ id: l.id, text: l.text }));
  const weeklyDone = weeklyTodos.filter((t) => t.completed).length;

  return (
    <div className={pageWrapHome}>
      <header className="q-home-hero flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-7">
        <div className="flex min-w-[14rem] items-center gap-3">
          <span className="q-badge size-12 bg-[#fff6e6] text-[#4a3326]">
            <HouseIcon />
          </span>
          <div className="whitespace-nowrap">
            <h2 className="text-lg font-bold text-[#4a3326]">我们的小家</h2>
            <p className="text-xs text-[#4a3326]/70">
              {boardMode ? "看板模式 · 点一下就能打勾" : "记录模式 · 添加和修改家务"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="q-chip tabular-nums">
            日常 {daily.length}
          </span>
          <span className="q-chip tabular-nums">
            本周 {weeklyDone}/{weeklyTodos.length}
          </span>
          <span className="q-chip tabular-nums">每月 {monthly.length}</span>
        </div>

        {showList ? (
          <div className="flex flex-wrap items-center gap-2">
            <ChoresModeSwitch mode={mode} />
            {mode === "record" ? (
              <Link href={writeHref} className="q-btn">
                <span aria-hidden className="text-base leading-none">＋</span>
                记一条
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>

      {showCreateForm ? (
        <ChoreForm
          action={createChoreLog}
          cadence="DAILY"
          text=""
          mode={mode}
          title="添一件家务"
          cancelHref={listHref}
        />
      ) : null}

      {showEditForm && editingLog ? (
        <ChoreForm
          action={updateChoreLog}
          cadence={editingLog.cadence}
          text={editingLog.text}
          id={editingLog.id}
          mode={mode}
          title="改一改"
          cancelHref={listHref}
        />
      ) : null}

      {showList ? (
        <div className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          <CadenceColumn cadence="DAILY" count={daily.length}>
            <ChoresLogList items={daily} mode={mode} emptyHint="还没有日常家务，去记录模式加一条吧。" />
          </CadenceColumn>
          <CadenceColumn cadence="WEEKLY" count={weekly.length}>
            {boardMode ? (
              <ChoresWeeklyTodoList items={weeklyTodos} mode={mode} emptyHint="还没有每周家务，可在记录模式添加。" />
            ) : (
              <ChoresLogList items={weekly} mode={mode} emptyHint="还没有每周家务记录。" />
            )}
          </CadenceColumn>
          <CadenceColumn cadence="MONTHLY" count={monthly.length}>
            <ChoresLogList items={monthly} mode={mode} emptyHint="还没有每月家务记录。" />
          </CadenceColumn>
        </div>
      ) : null}
    </div>
  );
}
