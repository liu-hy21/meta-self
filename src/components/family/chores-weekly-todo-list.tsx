import { toggleChoreWeeklyDone } from "@/app/actions/data";
import { ChoresEmpty } from "@/components/family/chores-log-list";
import type { ChoresViewMode } from "@/lib/chores";

export type ChoreWeeklyTodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

export function ChoresWeeklyTodoList({
  items,
  mode,
  emptyHint,
}: {
  items: ChoreWeeklyTodoItem[];
  mode: ChoresViewMode;
  emptyHint: string;
}) {
  if (items.length === 0) return <ChoresEmpty hint={emptyHint} />;

  const done = items.filter((i) => i.completed).length;
  const pct = Math.round((done / items.length) * 100);
  const sorted = items.toSorted((a, b) => Number(a.completed) - Number(b.completed));

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#4a3326]">
          <span>本周进度</span>
          <span className="tabular-nums">
            {done} / {items.length}
            {done === items.length ? " · 全部搞定 ✿" : ""}
          </span>
        </div>
        <div className="q-progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ul className="space-y-2">
        {sorted.map((item) => (
          <li key={item.id}>
            <form action={toggleChoreWeeklyDone}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="mode" value={mode} />
              <button
                type="submit"
                aria-pressed={item.completed}
                aria-label={item.completed ? `${item.text}，标记未完成` : `${item.text}，标记完成`}
                className={`q-item ${item.completed ? "opacity-70" : ""}`}
              >
                <span className="flex items-start gap-3">
                <span className="q-check" data-done={item.completed}>
                  {item.completed ? (
                    <svg aria-hidden viewBox="0 0 12 12" className="size-3 text-[#4a3326]" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6.2 5 8.5 9.5 3.5" />
                    </svg>
                  ) : null}
                </span>
                <span
                  className={`min-w-0 flex-1 whitespace-pre-wrap pt-0.5 text-sm leading-6 text-[#4a3326] ${
                    item.completed ? "line-through decoration-2 decoration-[#4a3326]/40" : ""
                  }`}
                >
                  {item.text}
                </span>
                </span>
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
